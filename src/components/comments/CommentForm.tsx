import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Star, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CommentFormProps {
    promptId: string;
    onCommentAdded: () => void;
    userHasPurchased: boolean;
}

export const CommentForm = ({ promptId, onCommentAdded, userHasPurchased }: CommentFormProps) => {
    const [content, setContent] = useState('');
    const [rating, setRating] = useState<number | null>(null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast({
                title: "댓글 내용을 입력해주세요",
                variant: "destructive",
            });
            return;
        }

        if (userHasPurchased && !rating) {
            toast({
                title: "평점을 선택해주세요",
                description: "구매한 프롬프트에는 평점을 남겨주세요.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    title: "로그인이 필요합니다",
                    variant: "destructive",
                });
                return;
            }

            const { error } = await supabase
                .from('comments')
                .insert({
                    prompt_id: promptId,
                    user_id: user.id,
                    content: content.trim(),
                    rating: userHasPurchased ? rating : null,
                });

            if (error) {
                console.error('댓글 작성 실패:', error);

                // 테이블이 존재하지 않는 경우 특별한 안내 메시지
                if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
                    toast({
                        title: "댓글 기능 준비 중",
                        description: "댓글 기능이 아직 활성화되지 않았습니다. 잠시 후 다시 시도해주세요.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "댓글 작성 실패",
                        description: "잠시 후 다시 시도해주세요.",
                        variant: "destructive",
                    });
                }
                return;
            }

            // 리뷰(평점이 있는 댓글)를 작성한 경우 프롬프트 통계 업데이트
            if (userHasPurchased && rating) {
                await updatePromptStats(promptId);
            }

            toast({
                title: "댓글이 작성되었습니다",
                description: userHasPurchased ? "평점과 함께 댓글이 등록되었습니다." : "댓글이 등록되었습니다.",
            });

            // 폼 초기화
            setContent('');
            setRating(null);
            setHoveredRating(null);

            // 부모 컴포넌트에 새 댓글 추가 알림
            onCommentAdded();

        } catch (error: any) {
            console.error('댓글 작성 중 오류:', error);
            toast({
                title: "오류가 발생했습니다",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStarRating = () => {
        if (!userHasPurchased) return null;

        return (
            <div className="space-y-2">
                <Label>평점</Label>
                <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="focus:outline-none transition-colors"
                        >
                            <Star
                                className={`h-6 w-6 ${(hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                            />
                        </button>
                    ))}
                    {rating && (
                        <span className="ml-2 text-sm text-muted-foreground">
                            {rating}점
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {userHasPurchased ? '리뷰 작성하기' : '댓글 작성하기'}
                </CardTitle>
                {userHasPurchased && (
                    <p className="text-sm text-muted-foreground">
                        구매한 프롬프트에 대한 솔직한 리뷰를 남겨주세요.
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {renderStarRating()}

                    <div className="space-y-2">
                        <Label htmlFor="content">
                            {userHasPurchased ? '리뷰 내용' : '댓글 내용'}
                        </Label>
                        <Textarea
                            id="content"
                            placeholder={
                                userHasPurchased
                                    ? "이 프롬프트는 어떠셨나요? 다른 사용자들에게 도움이 될 리뷰를 남겨주세요."
                                    : "궁금한 점이나 의견을 자유롭게 남겨주세요."
                            }
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            className="resize-none"
                        />
                        <div className="text-right text-xs text-muted-foreground">
                            {content.length}/1000자
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || !content.trim() || (userHasPurchased && !rating)}
                        className="w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? '작성 중...' : (userHasPurchased ? '리뷰 등록' : '댓글 등록')}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
