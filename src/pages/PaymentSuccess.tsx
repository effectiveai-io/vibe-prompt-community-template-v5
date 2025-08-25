import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Home, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PaymentResult {
    orderId: string;
    paymentKey: string;
    amount: number;
    promptId: string;
}

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [processing, setProcessing] = useState(true);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [promptTitle, setPromptTitle] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('PaymentSuccess 컴포넌트 시작');
        console.log('현재 사용자:', user);
        console.log('URL 파라미터:', {
            orderId: searchParams.get('orderId'),
            paymentKey: searchParams.get('paymentKey'),
            amount: searchParams.get('amount')
        });

        // 사용자 정보가 로딩 중일 수 있으므로 잠시 대기
        const checkUserWithDelay = setTimeout(() => {
            if (!user) {
                console.log('사용자 정보 없음 - 로그인 페이지로 이동');
                const currentUrl = window.location.pathname + window.location.search;
                navigate('/auth', {
                    replace: true,
                    state: { from: currentUrl }
                });
                return;
            }

            // 사용자가 있을 때만 결제 처리 진행
            processPaymentSuccess();
        }, 1000); // 1초 대기

        return () => clearTimeout(checkUserWithDelay);
    }, [user, searchParams]);

    const processPaymentSuccess = () => {
        const orderId = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey');
        const amount = searchParams.get('amount');

        console.log('결제 성공 처리 시작:', { orderId, paymentKey, amount });

        if (!orderId || !paymentKey || !amount) {
            console.error('결제 정보 누락:', { orderId, paymentKey, amount });
            toast({
                title: "결제 정보 오류",
                description: "결제 정보가 올바르지 않습니다. 결제 페이지로 돌아갑니다.",
                variant: "destructive",
            });
            setTimeout(() => navigate(-1), 2000);
            return;
        }

        // orderId에서 promptId 추출 (ORDER_promptId_timestamp 형식)
        console.log('orderId 파싱 시작:', orderId);
        const orderParts = orderId.split('_');
        const promptId = orderParts.length >= 2 ? orderParts[1] : null;

        console.log('orderId 파싱 결과:', { orderParts, promptId });

        if (!promptId) {
            console.error('프롬프트 ID를 찾을 수 없습니다:', { orderId, orderParts });
            toast({
                title: "주문 정보 오류",
                description: "주문 정보가 올바르지 않습니다. 잠시 후 이전 페이지로 돌아갑니다.",
                variant: "destructive",
            });
            setTimeout(() => navigate(-1), 3000);
            return;
        }

        console.log('결제 정보 설정:', { orderId, paymentKey, amount, promptId });

        setPaymentResult({
            orderId,
            paymentKey,
            amount: parseInt(amount),
            promptId
        });

        // 결제 검증 및 구매 기록 생성
        console.log('결제 검증 시작 호출');
        verifyAndCreatePurchase(orderId, paymentKey, parseInt(amount), promptId);
    };

    const verifyAndCreatePurchase = async (orderId: string, paymentKey: string, amount: number, promptId: string) => {
        try {
            console.log('=== 결제 검증 프로세스 시작 ===');
            console.log('결제 검증 파라미터:', { orderId, paymentKey, amount, promptId });

            // 1. 서버에서 토스페이먼츠 결제 승인 API를 통해 결제를 검증
            console.log('Edge Function 호출 시작: confirm-payment');

            const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
                'confirm-payment',
                {
                    body: {
                        paymentKey,
                        orderId,
                        amount,
                    },
                }
            );

            console.log('Edge Function 응답:', { confirmData, confirmError });

            if (confirmError) {
                console.error('Edge Function 호출 실패:', confirmError);
                throw new Error(`결제 검증 API 호출 실패: ${confirmError.message}`);
            }

            if (!confirmData) {
                console.error('Edge Function에서 데이터 없음');
                throw new Error('결제 검증 응답 데이터가 없습니다.');
            }

            if (!confirmData.success) {
                console.error('결제 승인 실패:', confirmData.error);
                throw new Error(`결제 승인 실패: ${confirmData.error?.message || '알 수 없는 오류'} (${confirmData.error?.code || 'UNKNOWN'})`);
            }

            console.log('결제 승인 성공:', confirmData.payment);

            // 2. 검증된 결제 정보로 구매 기록 생성
            console.log('구매 기록 생성 시작');
            await createPurchaseRecord(confirmData.payment, promptId);

        } catch (error: any) {
            console.error('결제 검증 실패:', error);
            setError(error.message);
            setProcessing(false);
        }
    };

    const createPurchaseRecord = async (paymentData: any, promptId: string) => {
        try {
            console.log('구매 기록 생성 시작:', { paymentData, promptId });

            // 프롬프트 정보 조회
            const { data: promptData, error: promptError } = await supabase
                .from('prompts')
                .select('title')
                .eq('id', promptId)
                .single();

            if (promptError) {
                console.error('프롬프트 정보 조회 실패:', promptError);
                throw new Error('프롬프트 정보를 찾을 수 없습니다.');
            }

            setPromptTitle(promptData.title);
            console.log('프롬프트 정보 조회 성공:', promptData.title);

            // 구매 기록 생성 (기존 테이블 구조에 맞게 수정)
            const { data: purchaseData, error: purchaseError } = await supabase
                .from('purchases')
                .insert({
                    user_id: user!.id,
                    prompt_id: promptId,
                    price: paymentData.totalAmount,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (purchaseError) {
                console.error('구매 기록 생성 실패:', purchaseError);
                throw new Error('구매 기록 생성에 실패했습니다.');
            }

            console.log('구매 기록 생성 성공:', purchaseData);

            

            setProcessing(false);

            toast({
                title: "결제 완료!",
                description: `${promptData.title} 구매가 완료되었습니다.`,
                variant: "default",
            });

        } catch (error: any) {
            console.error('구매 기록 생성 실패:', error);
            setError(error.message);
            setProcessing(false);
        }
    };

    const retryPaymentVerification = () => {
        setError(null);
        setProcessing(true);
        processPaymentSuccess();
    };

    if (!user) {
        return null;
    }

    if (processing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">결제 처리를 확인하고 있습니다...</p>
                    <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">{error ? '결제 처리 중 오류' : '결제 완료'}</h1>
                </div>
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            {error ? (
                                <>
                                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                    </div>
                                    <CardTitle className="text-2xl">결제 처리 중 문제가 발생했습니다</CardTitle>
                                    <CardDescription>
                                        결제는 시도되었지만 처리 과정에서 오류가 발생했습니다. 아래 옵션을 선택해주세요.
                                    </CardDescription>
                                </>
                            ) : (
                                <>
                                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <CardTitle className="text-2xl">결제가 완료되었습니다!</CardTitle>
                                    <CardDescription>
                                        프롬프트를 성공적으로 구매했습니다. 이제 바로 사용할 수 있습니다.
                                    </CardDescription>
                                </>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {paymentResult && (
                                <div className="bg-muted p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">주문번호</span>
                                        <span className="font-mono text-sm">{paymentResult.orderId}</span>
                                    </div>
                                    {promptTitle && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">상품명</span>
                                            <span className="font-medium">{promptTitle}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">결제금액</span>
                                        <span className="font-semibold text-lg">₩{paymentResult.amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {error ? (
                                <>
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                                        <p className="text-red-800 dark:text-red-200 font-medium mb-2">오류 세부사항</p>
                                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            className="w-full"
                                            onClick={retryPaymentVerification}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            결제 확인 재시도
                                        </Button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" onClick={() => navigate('/my')}>
                                                마이 페이지
                                            </Button>
                                            <Button variant="outline" onClick={() => navigate('/')}>
                                                홈으로
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-center text-sm text-muted-foreground">
                                        <p>문제가 지속되면 고객센터에 문의해주세요.</p>
                                        <p>주문번호: {paymentResult?.orderId}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full"
                                            onClick={() => navigate(`/prompt/${paymentResult?.promptId}`)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            프롬프트 확인하기
                                        </Button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" onClick={() => navigate('/my')}>
                                                마이 페이지
                                            </Button>
                                            <Button variant="outline" onClick={() => navigate('/')}>
                                                홈으로
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-center text-sm text-muted-foreground space-y-1">
                                        <p>구매한 프롬프트는 언제든지 마이 페이지에서 확인할 수 있습니다.</p>
                                        <p>결제 내역은 이메일로 발송됩니다.</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* 추가 안내 카드 - 성공했을 때만 표시 */}
                    {!error && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg">다음 단계</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-semibold">1</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">프롬프트 확인</p>
                                        <p className="text-sm text-muted-foreground">구매한 프롬프트의 전체 내용을 확인하세요.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-semibold">2</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">프롬프트 활용</p>
                                        <p className="text-sm text-muted-foreground">AI 도구에 프롬프트를 복사하여 사용하세요.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-semibold">3</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">리뷰 작성</p>
                                        <p className="text-sm text-muted-foreground">사용 후기를 남겨 다른 사용자에게 도움을 주세요.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PaymentSuccess;
