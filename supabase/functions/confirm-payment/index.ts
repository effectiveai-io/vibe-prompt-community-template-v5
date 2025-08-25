import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
}

// 토스페이먼츠 테스트 시크릿 키
const TOSS_SECRET_KEY = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ConfirmPaymentRequest {
    paymentKey: string
    orderId: string
    amount: number
}

interface TossPaymentResponse {
    version: string
    paymentKey: string
    type: string
    orderId: string
    orderName: string
    mId: string
    currency: string
    method: string
    totalAmount: number
    balanceAmount: number
    status: string
    requestedAt: string
    approvedAt: string
    useEscrow: boolean
    lastTransactionKey: string | null
    suppliedAmount: number
    vat: number
    cultureExpense: boolean
    taxFreeAmount: number
    taxExemptionAmount: number
    cancels: any[] | null
    isPartialCancelable: boolean
    card?: {
        amount: number
        issuerCode: string
        acquirerCode: string
        number: string
        installmentPlanMonths: number
        approveNo: string
        useCardPoint: boolean
        cardType: string
        ownerType: string
        acquireStatus: string
        isInterestFree: boolean
        interestPayer: string | null
    }
    virtualAccount?: any
    transfer?: any
    mobilePhone?: any
    giftCertificate?: any
    foreignEasyPay?: any
    cashReceipt?: any
    discount?: any
    country: string
    failure?: {
        code: string
        message: string
    }
}

interface TossErrorResponse {
    code: string
    message: string
}

serve(async (req) => {
    console.log('=== confirm-payment Edge Function 시작 ===')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)

    // CORS 처리
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS 요청 처리')
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        console.log('POST가 아닌 메서드:', req.method)
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }

    try {
        console.log('=== STEP 1: 요청 바디 파싱 ===')
        const body: ConfirmPaymentRequest = await req.json()
        console.log('결제 승인 요청 데이터:', JSON.stringify(body, null, 2))

        // 필수 파라미터 검증
        if (!body.paymentKey || !body.orderId || !body.amount) {
            console.error('필수 파라미터 누락:', body)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'MISSING_PARAMETERS',
                        message: 'paymentKey, orderId, amount are required'
                    }
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('=== STEP 2: Supabase 클라이언트 초기화 ===')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        console.log('Supabase 클라이언트 초기화 완료')

        console.log('=== STEP 3: 결제 준비 정보 조회 ===')
        const { data: preparationData, error: preparationError } = await supabase
            .from('payment_preparations')
            .select('*')
            .eq('order_id', body.orderId)
            .eq('status', 'prepared')
            .single()

        if (preparationError) {
            console.error('결제 준비 정보 조회 실패:', preparationError)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'PREPARATION_NOT_FOUND',
                        message: '결제 준비 정보를 찾을 수 없습니다.',
                    },
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('결제 준비 정보 조회 성공:', preparationData)

        // 금액 검증
        if (preparationData.amount !== body.amount) {
            console.error('금액 불일치:', { expected: preparationData.amount, actual: body.amount })
            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'AMOUNT_MISMATCH',
                        message: '요청된 결제 금액이 준비된 결제 금액과 일치하지 않습니다.',
                    },
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('=== STEP 4: 토스페이먼츠 결제 승인 API 호출 ===')

        const tossRequestBody = {
            paymentKey: body.paymentKey,
            orderId: body.orderId,
            amount: body.amount,
        }

        console.log('토스페이먼츠 요청 데이터:', JSON.stringify(tossRequestBody, null, 2))

        const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(TOSS_SECRET_KEY + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tossRequestBody),
        })

        console.log('토스페이먼츠 응답 상태:', tossResponse.status)
        console.log('토스페이먼츠 응답 헤더:', Object.fromEntries(tossResponse.headers.entries()))

        const responseData = await tossResponse.json()
        console.log('토스페이먼츠 응답 데이터:', JSON.stringify(responseData, null, 2))

        if (!tossResponse.ok) {
            console.error('토스페이먼츠 API 오류:', responseData)
            const errorResponse: TossErrorResponse = responseData

            // 결제 준비 상태를 실패로 업데이트
            await supabase
                .from('payment_preparations')
                .update({
                    status: 'failed',
                    failure_reason: `${errorResponse.code}: ${errorResponse.message}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', preparationData.id)

            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: errorResponse.code,
                        message: errorResponse.message,
                    },
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('=== STEP 5: 결제 승인 성공 ===')
        const paymentData: TossPaymentResponse = responseData

        // 결제 준비 상태를 성공으로 업데이트
        const { error: updateError } = await supabase
            .from('payment_preparations')
            .update({
                status: 'confirmed',
                payment_key: paymentData.paymentKey,
                payment_method: paymentData.method,
                approved_at: paymentData.approvedAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', preparationData.id)

        if (updateError) {
            console.error('결제 준비 상태 업데이트 실패:', updateError)
            // 에러가 나도 결제는 성공한 것으로 처리
        }

        console.log('=== STEP 6: 성공 응답 준비 ===')

        const successResponse = {
            success: true,
            payment: {
                paymentKey: paymentData.paymentKey,
                orderId: paymentData.orderId,
                orderName: paymentData.orderName,
                method: paymentData.method,
                totalAmount: paymentData.totalAmount,
                status: paymentData.status,
                requestedAt: paymentData.requestedAt,
                approvedAt: paymentData.approvedAt,
                card: paymentData.card,
                virtualAccount: paymentData.virtualAccount,
                transfer: paymentData.transfer,
            },
            preparationInfo: {
                preparationId: preparationData.id,
                promptId: preparationData.prompt_id,
                userId: preparationData.user_id,
            },
            timestamp: new Date().toISOString()
        }

        console.log('최종 성공 응답:', JSON.stringify(successResponse, null, 2))

        return new Response(
            JSON.stringify(successResponse),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('=== 결제 승인 처리 중 치명적 오류 ===')
        console.error('에러 객체:', error)
        console.error('에러 메시지:', error.message)
        console.error('에러 스택:', error.stack)

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: '서버 내부 오류가 발생했습니다.',
                    details: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                },
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
