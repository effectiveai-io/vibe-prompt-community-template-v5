import { useState, useEffect } from 'react';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, Construction } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface CommentSectionProps {
    promptId: string;
    promptOwnerId: string;
}

export const CommentSection = ({ promptId, promptOwnerId }: CommentSectionProps) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userHasPurchased, setUserHasPurchased] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const [commentsTableExists, setCommentsTableExists] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        getCurrentUserAndPurchaseStatus();
        checkCommentsTableExists();
    }, [promptId]);

    const getCurrentUserAndPurchaseStatus = async () => {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (user) {
                // 사용자가 이 프롬프트를 구매했는지 확인
                const { data: purchase } = await supabase
                    .from('purchases')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('prompt_id', promptId)
                    .single();

                // 프롬프트 소유자인지 확인
                const isOwner = user.id === promptOwnerId;

                setUserHasPurchased(!!purchase || isOwner);
            }
        } catch (error) {
            console.error('사용자 상태 확인 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentAdded = () => {
        // 댓글 목록 새로고침을 위한 트리거
        setRefreshTrigger(prev => prev + 1);
    };

    const checkCommentsTableExists = async () => {
        try {
            // 간단한 쿼리로 테이블 존재 여부 확인
            const { error } = await supabase
                .from('comments')
                .select('count', { count: 'exact', head: true })
                .limit(1);

            if (error && (error.message?.includes('relation') && error.message?.includes('does not exist'))) {
                setCommentsTableExists(false);
            }
        } catch (error) {
            console.warn('댓글 테이블 확인 실패:', error);
            setCommentsTableExists(false);
        }
    };

    const handleLoginClick = () => {
        navigate('/auth', {
            state: { from: location.pathname },
            replace: true
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
                <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    // 댓글 테이블이 존재하지 않는 경우 준비 중 메시지 표시
    if (!commentsTableExists) {
        return (
            <div className="space-y-6">
                <Alert>
                    <Construction className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                        <div className="space-y-2">
                            <p className="font-medium">댓글 기능 준비 중입니다</p>
                            <p className="text-sm text-muted-foreground">
                                곧 다른 사용자들과 의견을 나눌 수 있는 댓글 기능이 추가될 예정입니다.
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 댓글 작성 폼 */}
            {currentUser ? (
                <CommentForm
                    promptId={promptId}
                    onCommentAdded={handleCommentAdded}
                    userHasPurchased={userHasPurchased}
                />
            ) : (
                <Card>
                    <CardContent className="py-8 text-center">
                        <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
                        <p className="text-muted-foreground mb-4">
                            댓글을 작성하려면 로그인이 필요합니다.
                        </p>
                        <Button onClick={handleLoginClick}>
                            <LogIn className="h-4 w-4 mr-2" />
                            로그인하기
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* 댓글 목록 */}
            <CommentList
                promptId={promptId}
                refreshTrigger={refreshTrigger}
            />
        </div>
    );
};
