import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * 인증이 필요한 페이지에서 사용하는 가드 훅
 * 로그인하지 않은 사용자를 자동으로 로그인 페이지로 리다이렉트
 */
export const useAuthGuard = (options?: {
    redirectTo?: string;
    delay?: number;
    onRedirect?: () => void;
}) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        redirectTo = '/auth',
        delay = 0,
        onRedirect
    } = options || {};

    useEffect(() => {
        // 로딩 중이면 대기
        if (loading) return;

        // 사용자가 없으면 리다이렉트
        if (!user) {
            const redirectWithDelay = () => {
                onRedirect?.();
                navigate(redirectTo, {
                    replace: true,
                    state: { from: location.pathname + location.search }
                });
            };

            if (delay > 0) {
                const timer = setTimeout(redirectWithDelay, delay);
                return () => clearTimeout(timer);
            } else {
                redirectWithDelay();
            }
        }
    }, [user, loading, navigate, location, redirectTo, delay, onRedirect]);

    return {
        isAuthenticated: !!user,
        isLoading: loading,
        user
    };
};
