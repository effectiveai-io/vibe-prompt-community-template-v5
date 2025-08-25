// 공통 타입 정의
export interface BasePrompt {
    id: string;
    title: string;
    description: string;
    price: number;
    is_free: boolean;
    status: 'pending' | 'approved' | 'rejected';

    rating_average: number | null;
    rating_count: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    user_id: string;
    username: string | null;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    buymeacoffee_username: string | null;
    created_at: string;
    updated_at: string;
}

// 상세 정보가 포함된 프롬프트 (Explore, PromptDetail에서 사용)
export interface PromptWithDetails extends BasePrompt {
    content: string;
    user_id: string;
    category_id: string | null;
    tags: string[] | null;
    is_featured: boolean;
    categories: { name: string; slug: string } | null;
    profiles: Profile;
}

// 내가 만든 프롬프트 (Collection, MyPage에서 사용)
export interface MyPrompt extends BasePrompt {
    content: string;
    user_id: string;
    category_id: string | null;
    tags: string[] | null;
    is_featured: boolean;
    categories: { name: string } | null;
}

// 구매한 프롬프트 정보
export interface Purchase {
    id: string;
    user_id: string;
    prompt_id: string;
    price: number;
    created_at: string;
    prompts: PromptWithDetails;
}

// 결제 관련 타입
export interface PaymentResult {
    orderId: string;
    paymentKey: string;
    amount: number;
    promptId: string;
}

export interface PromptInfo {
    id: string;
    title: string;
    price: number;
    is_free: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: string;
    };
}

// 로딩 상태 타입
export interface LoadingState {
    loading: boolean;
    error: string | null;
}

// 폼 검증 타입
export interface FormErrors {
    [key: string]: string | undefined;
}

// 댓글 타입
export interface Comment {
    id: string;
    prompt_id: string;
    user_id: string;
    content: string;
    rating: number | null;
    created_at: string;
    updated_at: string;
    profiles?: {
        display_name?: string;
        username?: string;
        avatar_url?: string;
    };
}
