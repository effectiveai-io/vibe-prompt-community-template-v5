// API 관련 상수
export const API_ENDPOINTS = {
    PREPARE_PAYMENT: 'prepare-payment',
    CONFIRM_PAYMENT: 'confirm-payment',
} as const;

// 페이지 경로 상수
export const ROUTES = {
    HOME: '/',
    AUTH: '/auth',
    PROMPT_DETAIL: '/prompt/:id',
    SELL: '/sell',
    COLLECTION: '/collection',
    MY_PAGE: '/my',
    PAYMENT: '/payment',
    PAYMENT_SUCCESS: '/payment/success',
    PAYMENT_FAIL: '/payment/fail',
    COMPONENTS: '/components',
} as const;

// 프롬프트 상태
export const PROMPT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

// 결제 관련 상수
export const PAYMENT = {
    TEST_CLIENT_KEY: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm',
    ORDER_PREFIX: 'ORDER_',
} as const;

// UI 관련 상수
export const UI = {
    CARD_HOVER_SCALE: 'hover:scale-102',
    TRANSITION_ALL: 'transition-all duration-300',
    LOADING_SPINNER_SIZES: {
        SM: 'h-4 w-4',
        MD: 'h-8 w-8',
        LG: 'h-12 w-12',
    },
} as const;

// 메시지 상수
export const MESSAGES = {
    LOADING: {
        DEFAULT: '로딩 중...',
        PAGE: '페이지를 불러오는 중...',
        DATA: '데이터를 불러오는 중...',
        AUTH_CHECK: '인증 상태를 확인하는 중...',
    },
    ERROR: {
        DEFAULT: '오류가 발생했습니다',
        NETWORK: '네트워크 오류가 발생했습니다',
        AUTH_REQUIRED: '로그인이 필요합니다',
        PAYMENT_FAILED: '결제 처리 중 오류가 발생했습니다',
        DATA_LOAD_FAILED: '데이터를 불러오는 중 오류가 발생했습니다',
    },
    SUCCESS: {
        PAYMENT_COMPLETE: '결제가 완료되었습니다!',
        SAVE_SUCCESS: '저장이 완료되었습니다',
        DELETE_SUCCESS: '삭제가 완료되었습니다',
    },
} as const;
