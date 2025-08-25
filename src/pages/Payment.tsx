import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// 토스페이먼츠 테스트 클라이언트 키
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

interface PromptInfo {
    id: string;
    title: string;
    price: number;
    is_free: boolean;
}

const Payment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [prompt, setPrompt] = useState<PromptInfo | null>(null);
    const [widgets, setWidgets] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const promptId = searchParams.get('promptId');
    const amount = parseInt(searchParams.get('amount') || '0');
    const orderId = searchParams.get('orderId') || `ORDER_${Date.now()}`;

    useEffect(() => {
        // 로그인 확인
        if (!user) {
            const currentUrl = window.location.pathname + window.location.search;
            navigate('/auth', {
                replace: true,
                state: { from: currentUrl }
            });
            return;
        }

        if (promptId) {
            fetchPrompt();
            initializePayment();
        }
    }, [promptId, user]);

    const fetchPrompt = async () => {
        if (!promptId) return;

        try {
            const { data, error } = await supabase
                .from('prompts')
                .select('id, title, price, is_free')
                .eq('id', promptId)
                .eq('status', 'approved')
                .single();

            if (error) throw error;
            setPrompt(data);
        } catch (error: any) {
            toast({
                title: "프롬프트 로딩 실패",
                description: error.message,
                variant: "destructive",
            });
            navigate('/');
        }
    };

    const initializePayment = async () => {
        try {
            console.log('토스페이먼츠 SDK 초기화 시작');

            const tossPayments = await loadTossPayments(clientKey);
            const customerKey = user?.id || `guest_${Date.now()}`;

            const widgetsInstance = tossPayments.widgets({ customerKey });

            // 결제 금액 설정
            await widgetsInstance.setAmount({
                currency: "KRW",
                value: amount,
            });

            setWidgets(widgetsInstance);
            console.log('토스페이먼츠 위젯 초기화 완료');

            setLoading(false);

            // 위젯 렌더링
            renderPaymentWidget(widgetsInstance);

        } catch (error: any) {
            console.error('결제 시스템 초기화 실패:', error);
            toast({
                title: "결제 시스템 오류",
                description: "결제 시스템을 초기화할 수 없습니다. 새로고침 후 다시 시도해주세요.",
                variant: "destructive",
            });
            setLoading(false);
        }
    };

    const renderPaymentWidget = async (widgetsInstance: any) => {
        try {
            // 결제수단 위젯 렌더링
            setTimeout(async () => {
                const paymentMethodEl = document.getElementById("payment-method");
                if (paymentMethodEl && widgetsInstance) {
                    await widgetsInstance.renderPaymentMethods({
                        selector: "#payment-method",
                        variantKey: "DEFAULT"
                    });
                    console.log('결제수단 위젯 렌더링 완료');
                }
            }, 100);

            // 약관 위젯 렌더링
            setTimeout(async () => {
                const agreementEl = document.getElementById("agreement");
                if (agreementEl && widgetsInstance) {
                    await widgetsInstance.renderAgreement({
                        selector: "#agreement",
                        variantKey: "AGREEMENT"
                    });
                    console.log('약관 위젯 렌더링 완료');
                }
            }, 200);

        } catch (error) {
            console.error('위젯 렌더링 실패:', error);
        }
    };

    const handlePayment = async () => {
        if (!widgets || !prompt || !user) {
            toast({
                title: "오류",
                description: "결제 준비가 완료되지 않았습니다.",
                variant: "destructive",
            });
            return;
        }

        try {
            setProcessing(true);

            // 1. Edge Function으로 결제 준비
            console.log('결제 준비 시작');
            const { data: prepareData, error: prepareError } = await supabase.functions.invoke('prepare-payment', {
                body: {
                    userId: user.id,
                    promptId: prompt.id,
                    orderId: orderId,
                    amount: amount,
                    orderName: prompt.title
                }
            });

            if (prepareError) {
                throw new Error(`결제 준비 실패: ${prepareError.message}`);
            }

            console.log('결제 준비 완료:', prepareData);

            // 2. 토스페이먼츠 결제 요청
            console.log('토스페이먼츠 결제 요청 시작');

            await widgets.requestPayment({
                orderId: orderId,
                orderName: prompt.title,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
            });

        } catch (error: any) {
            console.error('결제 요청 실패:', error);

            if (error.code === 'USER_CANCEL') {
                toast({
                    title: "결제 취소",
                    description: "사용자가 결제를 취소했습니다.",
                    variant: "default",
                });
            } else {
                toast({
                    title: "결제 실패",
                    description: error.message || "결제 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            }

            setProcessing(false);
        }
    };

    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">결제 시스템을 준비하고 있습니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">결제하기</h1>
                </div>
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* 주문 정보 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>주문 정보</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {prompt && (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">상품명</span>
                                        <span className="font-medium">{prompt.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">주문번호</span>
                                        <span className="font-mono text-sm">{orderId}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">결제금액</span>
                                        <span className="font-semibold text-lg">₩{amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 결제수단 선택 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>결제수단 선택</CardTitle>
                            <CardDescription>
                                원하시는 결제 방법을 선택해주세요.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div id="payment-method" className="min-h-[200px]">
                                {/* 토스페이먼츠 결제수단 위젯이 여기에 렌더링됩니다 */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 약관 동의 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>약관 동의</CardTitle>
                            <CardDescription>
                                결제 진행을 위해 아래 약관에 동의해주세요.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div id="agreement" className="min-h-[100px]">
                                {/* 토스페이먼츠 약관 위젯이 여기에 렌더링됩니다 */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 보안 안내 */}
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="font-medium text-green-800 dark:text-green-200">
                                        안전한 결제
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        토스페이먼츠의 보안 시스템으로 안전하게 결제됩니다.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 테스트 환경 안내 */}
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <p className="font-medium text-blue-800 dark:text-blue-200">
                                        테스트 환경
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        현재 테스트 환경입니다. 실제 결제는 발생하지 않습니다.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 결제 버튼 */}
                    <Card>
                        <CardContent className="pt-6">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handlePayment}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        결제 진행 중...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        ₩{amount.toLocaleString()} 결제하기
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Payment;
