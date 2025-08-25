import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PaymentFail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [errorCode, setErrorCode] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [orderId, setOrderId] = useState<string>('');

    useEffect(() => {
        // URL 파라미터에서 오류 정보 추출
        const code = searchParams.get('code') || 'UNKNOWN_ERROR';
        const message = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
        const order = searchParams.get('orderId') || '';

        console.log('결제 실패 정보:', { code, message, order });

        setErrorCode(code);
        setErrorMessage(message);
        setOrderId(order);
    }, [searchParams]);

    const getErrorDescription = (code: string) => {
        switch (code) {
            case 'USER_CANCEL':
                return '사용자가 결제를 취소했습니다.';
            case 'INSUFFICIENT_FUNDS':
                return '잔액이 부족합니다. 다른 결제 수단을 이용해주세요.';
            case 'INVALID_CARD':
                return '유효하지 않은 카드입니다. 카드 정보를 확인해주세요.';
            case 'EXPIRED_CARD':
                return '만료된 카드입니다. 다른 카드를 이용해주세요.';
            case 'PAYMENT_TIMEOUT':
                return '결제 시간이 초과되었습니다. 다시 시도해주세요.';
            case 'NETWORK_ERROR':
                return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인 후 다시 시도해주세요.';
            case 'SERVER_ERROR':
                return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            default:
                return '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.';
        }
    };

    const handleRetryPayment = () => {
        if (orderId) {
            // orderId에서 promptId 추출 (ORDER_promptId_timestamp 형식)
            const orderParts = orderId.split('_');
            const promptId = orderParts.length >= 2 ? orderParts[1] : null;

            if (promptId) {
                console.log('결제 재시도:', { orderId, promptId });
                navigate(`/prompt/${promptId}`);
                return;
            }
        }

        // promptId를 추출할 수 없는 경우 홈으로 이동
        navigate('/');
    };

    const isUserCancellation = errorCode === 'USER_CANCEL';

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">결제 실패</h1>
                </div>
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl">
                                {isUserCancellation ? '결제가 취소되었습니다' : '결제에 실패했습니다'}
                            </CardTitle>
                            <CardDescription>
                                {getErrorDescription(errorCode)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 오류 정보 */}
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-red-800 dark:text-red-200 font-medium">오류 코드</span>
                                        <span className="text-sm text-red-700 dark:text-red-300 font-mono">{errorCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-red-800 dark:text-red-200 font-medium">오류 메시지</span>
                                        <span className="text-sm text-red-700 dark:text-red-300">{errorMessage}</span>
                                    </div>
                                    {orderId && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-red-800 dark:text-red-200 font-medium">주문번호</span>
                                            <span className="text-sm text-red-700 dark:text-red-300 font-mono">{orderId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="space-y-3">
                                {!isUserCancellation && (
                                    <Button
                                        className="w-full"
                                        onClick={handleRetryPayment}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        다시 시도
                                    </Button>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={() => navigate(-1)}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        이전 페이지
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate('/')}>
                                        <Home className="h-4 w-4 mr-2" />
                                        홈으로
                                    </Button>
                                </div>
                            </div>

                            {/* 도움말 섹션 */}
                            <div className="border-t pt-6">
                                <h3 className="font-medium mb-3">해결 방법</h3>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {errorCode === 'USER_CANCEL' ? (
                                        <ul className="space-y-1">
                                            <li>• 결제를 다시 진행하시려면 상품 페이지로 돌아가세요</li>
                                            <li>• 다른 상품을 찾아보시려면 홈으로 이동하세요</li>
                                        </ul>
                                    ) : (
                                        <ul className="space-y-1">
                                            <li>• 카드 정보와 잔액을 확인해주세요</li>
                                            <li>• 인터넷 연결 상태를 확인해주세요</li>
                                            <li>• 다른 결제 수단을 시도해보세요</li>
                                            <li>• 문제가 지속되면 고객센터에 문의해주세요</li>
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* 테스트 환경 안내 */}
                            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                        테스트 환경
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        현재 테스트 환경입니다. 실제 결제는 발생하지 않으며, 일부 결제 수단은 제한될 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default PaymentFail;
