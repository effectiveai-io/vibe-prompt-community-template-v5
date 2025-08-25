import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MoreHorizontal, Edit, Trash2, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Comment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

interface CommentListProps {
    promptId: string;
    refreshTrigger: number;
}

export const CommentList = ({ promptId, refreshTrigger }: CommentListProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchComments = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('comments')
                .select(`
          id,
          prompt_id,
          user_id,
          content,
          rating,
          created_at,
          updated_at
        `)
                .eq('prompt_id', promptId)
                .order('created_at', { ascending: false });

            if (fetchError) {
                // 테이블이 존재하지 않는 경우 빈 배열로 처리
                if (fetchError.code === 'PGRST116' || fetchError.message.includes('relation "public.comments" does not exist')) {
                    console.warn('댓글 테이블이 아직 생성되지 않았습니다.');
                    setComments([]);
                    return;
                }
                throw fetchError;
            }

            // 각 댓글에 대한 프로필 정보 가져오기
            if (data && data.length > 0) {
                const userIds = [...new Set(data.map(comment => comment.user_id))];
                
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, display_name, username, avatar_url')
                    .in('user_id', userIds);

                if (profilesError) {
                    console.error('프로필 정보 조회 실패:', profilesError);
                }

                // 댓글과 프로필 정보 매칭
                const commentsWithProfiles = data.map(comment => {
                    const profile = profilesData?.find(p => p.user_id === comment.user_id);
                    return {
                        ...comment,
                        profiles: profile || null
                    };
                });

                setComments(commentsWithProfiles);
            } else {
                setComments(data || []);
            }
        } catch (error: any) {
            console.error('댓글 조회 실패:', error);

            // 테이블 부재 오류인 경우 사용자에게 더 친화적인 메시지
            if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
                setError(null); // 에러 표시하지 않음
                setComments([]); // 빈 댓글 목록으로 표시
            } else {
                setError('댓글을 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

    useEffect(() => {
        fetchComments();
        getCurrentUser();
    }, [promptId, refreshTrigger]);

    // 프롬프트 통계 업데이트 함수
    const updatePromptStats = async (promptId: string) => {
        try {
            // 해당 프롬프트의 모든 평점이 있는 댓글 조회
            const { data: comments, error: fetchError } = await supabase
                .from('comments')
                .select('rating')
                .eq('prompt_id', promptId)
                .not('rating', 'is', null);

            if (fetchError) {
                console.error('평점 조회 실패:', fetchError);
                return;
            }

            if (!comments || comments.length === 0) {
                // 평점이 없는 경우 초기화
                await supabase
                    .from('prompts')
                    .update({
                        rating_average: 0,
                        rating_count: 0
                    })
                    .eq('id', promptId);
                return;
            }

            // 평균 평점 계산
            const totalRating = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
            const averageRating = totalRating / comments.length;

            // prompts 테이블 업데이트
            const { error: updateError } = await supabase
                .from('prompts')
                .update({
                    rating_average: parseFloat(averageRating.toFixed(1)),
                    rating_count: comments.length
                })
                .eq('id', promptId);

            if (updateError) {
                console.error('프롬프트 통계 업데이트 실패:', updateError);
            }
        } catch (error) {
            console.error('프롬프트 통계 업데이트 중 오류:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            // 삭제할 댓글의 평점 정보 먼저 확인
            const { data: commentToDelete } = await supabase
                .from('comments')
                .select('rating')
                .eq('id', commentId)
                .single();

            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                throw error;
            }

            toast({
                title: "댓글이 삭제되었습니다",
            });

            // 평점이 있는 댓글이었다면 통계 업데이트
            if (commentToDelete?.rating) {
                await updatePromptStats(promptId);
            }

            // 댓글 목록 새로고침
            fetchComments();
        } catch (error: any) {
            console.error('댓글 삭제 실패:', error);
            toast({
                title: "댓글 삭제 실패",
                description: "잠시 후 다시 시도해주세요.",
                variant: "destructive",
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return '방금 전';
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}시간 전`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}일 전`;

        return date.toLocaleDateString('ko-KR');
    };

    const getDisplayName = (comment: Comment) => {
        return comment.profiles?.display_name ||
            comment.profiles?.username ||
            '익명 사용자';
    };

    const renderStarRating = (rating: number) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-200'
                            }`}
                    />
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                    {rating}.0
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <LoadingSpinner />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-8">
                    <ErrorDisplay
                        message={error}
                        onRetry={fetchComments}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        댓글 ({comments.length})
                    </h3>
                </div>
            </CardHeader>
            <CardContent>
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>아직 댓글이 없습니다.</p>
                        <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment, index) => (
                            <div key={comment.id}>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {getDisplayName(comment).charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-sm">
                                                        {getDisplayName(comment)}
                                                    </span>
                                                    {comment.rating && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            리뷰
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {currentUserId === comment.user_id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        수정
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        삭제
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {comment.rating && (
                                        <div className="ml-11">
                                            {renderStarRating(comment.rating)}
                                        </div>
                                    )}

                                    <div className="ml-11">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>

                                {index < comments.length - 1 && (
                                    <Separator className="mt-4" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
