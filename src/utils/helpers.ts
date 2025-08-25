import { PROMPT_STATUS, PAYMENT } from './constants';

/**
 * 날짜 포맷팅 유틸리티
 */
export const formatDate = (dateString: string, locale: string = 'ko-KR'): string => {
    return new Date(dateString).toLocaleDateString(locale);
};

export const formatDateTime = (dateString: string, locale: string = 'ko-KR'): string => {
    return new Date(dateString).toLocaleString(locale);
};

/**
 * 숫자 포맷팅 유틸리티
 */
export const formatPrice = (price: number): string => {
    return `₩${price.toLocaleString()}`;
};

export const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

/**
 * 문자열 유틸리티
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

export const generateOrderId = (promptId: string): string => {
    const timestamp = Date.now();
    return `${PAYMENT.ORDER_PREFIX}${promptId}_${timestamp}`;
};

/**
 * 상태 관련 유틸리티
 */
export const getStatusLabel = (status: string): string => {
    switch (status) {
        case PROMPT_STATUS.APPROVED:
            return '승인됨';
        case PROMPT_STATUS.PENDING:
            return '검토 중';
        case PROMPT_STATUS.REJECTED:
            return '거부됨';
        default:
            return status;
    }
};

export const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
        case PROMPT_STATUS.APPROVED:
            return 'default';
        case PROMPT_STATUS.PENDING:
            return 'secondary';
        case PROMPT_STATUS.REJECTED:
            return 'destructive';
        default:
            return 'outline';
    }
};

/**
 * URL 관련 유틸리티
 */
export const buildPromptDetailUrl = (promptId: string): string => {
    return `/prompt/${promptId}`;
};

export const extractPromptIdFromOrderId = (orderId: string): string | null => {
    // ORDER_promptId_timestamp 형식에서 promptId 추출
    const parts = orderId.split('_');
    return parts.length >= 2 ? parts[1] : null;
};

/**
 * 검증 유틸리티
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidOrderId = (orderId: string): boolean => {
    return orderId.startsWith(PAYMENT.ORDER_PREFIX) && orderId.split('_').length >= 3;
};

/**
 * 배열 유틸리티
 */
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const value = String(item[key]);
        if (!groups[value]) {
            groups[value] = [];
        }
        groups[value].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

/**
 * 카테고리 관련 유틸리티 (기존 Explore.tsx에서 이동)
 */
export const getCategoryGradient = (slug: string): string => {
    const gradients: Record<string, string> = {
        'business': 'bg-gradient-to-br from-blue-500 to-blue-700',
        'copywriting': 'bg-gradient-to-br from-emerald-500 to-emerald-700',
        'coding': 'bg-gradient-to-br from-slate-700 to-slate-900',
        'design': 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500',
        'ai-art': 'bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500',
        'education': 'bg-gradient-to-br from-amber-500 to-orange-600',
        'creative-writing': 'bg-gradient-to-br from-purple-500 to-indigo-700',
        'marketing': 'bg-gradient-to-br from-orange-500 to-red-600',
        'technical': 'bg-gradient-to-br from-teal-500 to-cyan-700',
        'creative': 'bg-gradient-to-br from-violet-500 to-purple-700',
    };
    return gradients[slug] || 'bg-gradient-to-br from-gray-500 to-gray-700';
};

/**
 * 에러 처리 유틸리티
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return '알 수 없는 오류가 발생했습니다';
};

/**
 * 로컬 스토리지 유틸리티
 */
export const storage = {
    get: <T>(key: string, defaultValue?: T): T | null => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue || null;
        } catch {
            return defaultValue || null;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // 로컬 스토리지 저장 실패 시 무시
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch {
            // 로컬 스토리지 삭제 실패 시 무시
        }
    },

    clear: (): void => {
        try {
            localStorage.clear();
        } catch {
            // 로컬 스토리지 클리어 실패 시 무시
        }
    }
};
