import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 헤더
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
}

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PreparePaymentRequest {
    userId: string
    promptId: string
    orderId: string
    amount: number
    orderName: string
}

serve(async (req) => {
    console.log('=== prepare-payment Edge Function 시작 ===')
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
        console.log('=== STEP 1: 요청 데이터 파싱 ===')

        const body: PreparePaymentRequest = await req.json()
        console.log('결제 준비 요청 데이터:', JSON.stringify(body, null, 2))

        // 필수 파라미터 검증
        if (!body.userId || !body.promptId || !body.orderId || !body.amount || !body.orderName) {
            console.error('필수 파라미터 누락:', body)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'MISSING_PARAMETERS',
                    details: 'userId, promptId, orderId, amount, orderName are required'
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

        console.log('=== STEP 3: 프롬프트 정보 조회 ===')
        console.log('조회할 promptId:', body.promptId)

        const { data: promptData, error: promptError } = await supabase
            .from('prompts')
            .select('id, title, price, is_free, status')
            .eq('id', body.promptId)
            .single()

        if (promptError) {
            console.error('프롬프트 조회 실패:', promptError)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'PROMPT_QUERY_ERROR',
                    details: '프롬프트 조회 중 오류가 발생했습니다.',
                    promptError: promptError.message
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        if (!promptData) {
            console.error('프롬프트 데이터 없음 - promptId:', body.promptId)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'PROMPT_NOT_FOUND',
                    details: '요청한 프롬프트를 찾을 수 없습니다.'
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('프롬프트 정보 조회 성공:', promptData)

        // 프롬프트 상태 확인
        if (promptData.status !== 'approved') {
            console.error('승인되지 않은 프롬프트:', promptData.status)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'PROMPT_NOT_APPROVED',
                    details: '승인되지 않은 프롬프트입니다.'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('=== STEP 4: 가격 검증 ===')
        console.log('예상 가격:', promptData.price, '요청 가격:', body.amount)

        if (promptData.price !== body.amount) {
            console.error('가격 불일치:', { expected: promptData.price, actual: body.amount })
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'PRICE_MISMATCH',
                    details: '요청된 결제 금액이 상품 가격과 일치하지 않습니다.',
                    expected: promptData.price,
                    actual: body.amount
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('가격 검증 완료')

        console.log('=== STEP 5: 기존 구매 이력 확인 ===')
        console.log('확인할 userId:', body.userId, 'promptId:', body.promptId)

        const { data: existingPurchase, error: purchaseCheckError } = await supabase
            .from('purchases')
            .select('id, created_at')
            .eq('user_id', body.userId)
            .eq('prompt_id', body.promptId)
            .maybeSingle()

        if (purchaseCheckError) {
            console.error('구매 이력 확인 오류:', purchaseCheckError)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'PURCHASE_CHECK_ERROR',
                    details: '구매 이력 확인 중 오류가 발생했습니다.',
                    purchaseCheckError: purchaseCheckError.message
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        if (existingPurchase) {
            console.log('이미 구매한 상품 발견:', existingPurchase)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'ALREADY_PURCHASED',
                    details: '이미 구매한 상품입니다.',
                    purchaseDate: existingPurchase.created_at
                }),
                {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('구매 이력 확인 완료 - 새로운 구매 가능')

        console.log('=== STEP 6: 결제 준비 정보 저장 ===')

        // payment_preparations 테이블에 결제 준비 정보 저장
        const { data: preparationData, error: preparationError } = await supabase
            .from('payment_preparations')
            .insert({
                user_id: body.userId,
                prompt_id: body.promptId,
                order_id: body.orderId,
                amount: body.amount,
                order_name: body.orderName,
                status: 'prepared',
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (preparationError) {
            console.error('결제 준비 정보 저장 실패:', preparationError)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'PREPARATION_SAVE_ERROR',
                    details: '결제 준비 정보 저장 중 오류가 발생했습니다.',
                    preparationError: preparationError.message
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        console.log('결제 준비 정보 저장 성공:', preparationData)

        console.log('=== STEP 7: 성공 응답 준비 ===')

        const successResponse = {
            success: true,
            orderId: body.orderId,
            preparationId: preparationData.id,
            promptInfo: {
                id: promptData.id,
                title: promptData.title,
                price: promptData.price,
                is_free: promptData.is_free
            },
            validationStatus: {
                promptFound: true,
                priceValid: true,
                notPurchased: true,
                approved: true,
                preparationSaved: true
            },
            timestamp: new Date().toISOString()
        }

        console.log('결제 준비 성공 응답:', JSON.stringify(successResponse, null, 2))

        return new Response(
            JSON.stringify(successResponse),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        console.error('=== 결제 준비 처리 중 치명적 오류 ===')
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
