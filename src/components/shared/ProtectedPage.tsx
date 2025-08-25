import { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { PageLoading } from './LoadingSpinner';

interface ProtectedPageProps {
    children: ReactNode;
    loadingText?: string;
    redirectDelay?: number;
}

/**
 * 인증이 필요한 페이지를 감싸는 래퍼 컴포넌트
 * 자동으로 인증 상태를 확인하고 필요시 리다이렉트 수행
 */
export const ProtectedPage = ({
    children,
    loadingText = "인증 상태를 확인하는 중...",
    redirectDelay = 0
}: ProtectedPageProps) => {
    const { isAuthenticated, isLoading } = useAuthGuard({
        delay: redirectDelay
    });

    // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
    if (isLoading || !isAuthenticated) {
        return <PageLoading text={loadingText} />;
    }

    // 인증된 사용자에게만 컨텐츠 표시
    return <>{children}</>;
};
