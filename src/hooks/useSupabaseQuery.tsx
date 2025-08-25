import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { LoadingState } from '@/types';

/**
 * Supabase 쿼리를 위한 공통 훅
 * 로딩, 에러, 재시도 로직을 포함
 */
export const useSupabaseQuery = <T,>(
    queryFn: () => Promise<T>,
    dependencies: any[] = [],
    options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        showErrorToast?: boolean;
        errorMessage?: string;
    }
) => {
    const [data, setData] = useState<T | null>(null);
    const [state, setState] = useState<LoadingState>({ loading: true, error: null });
    const { toast } = useToast();

    const {
        onSuccess,
        onError,
        showErrorToast = true,
        errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.'
    } = options || {};

    const executeQuery = useCallback(async () => {
        setState({ loading: true, error: null });

        try {
            const result = await queryFn();
            setData(result);
            setState({ loading: false, error: null });
            onSuccess?.(result);
        } catch (error: any) {
            const errorMsg = error.message || errorMessage;
            setState({ loading: false, error: errorMsg });

            if (showErrorToast) {
                toast({
                    title: "오류 발생",
                    description: errorMsg,
                    variant: "destructive",
                });
            }

            onError?.(error);
        }
    }, [queryFn, onSuccess, onError, showErrorToast, errorMessage, toast]);

    const refetch = useCallback(() => {
        executeQuery();
    }, [executeQuery]);

    useEffect(() => {
        executeQuery();
    }, dependencies);

    return {
        data,
        loading: state.loading,
        error: state.error,
        refetch,
        isSuccess: !state.loading && !state.error,
        isError: !state.loading && !!state.error
    };
};

/**
 * 여러 Supabase 쿼리를 병렬로 실행하는 훅
 */
export const useSupabaseQueries = <T extends Record<string, any>>(
    queries: Record<keyof T, () => Promise<T[keyof T]>>,
    dependencies: any[] = []
) => {
    const [data, setData] = useState<Partial<T>>({});
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const { toast } = useToast();

    const executeQueries = useCallback(async () => {
        setLoading(true);
        setErrors({});

        const results: Partial<T> = {};
        const queryErrors: Partial<Record<keyof T, string>> = {};

        await Promise.allSettled(
            Object.entries(queries).map(async ([key, queryFn]) => {
                try {
                    const result = await queryFn();
                    results[key as keyof T] = result;
                } catch (error: any) {
                    queryErrors[key as keyof T] = error.message;
                }
            })
        );

        setData(results);
        setErrors(queryErrors);
        setLoading(false);

        // 에러가 있으면 토스트 표시
        const errorCount = Object.keys(queryErrors).length;
        if (errorCount > 0) {
            toast({
                title: "일부 데이터 로딩 실패",
                description: `${errorCount}개의 요청에서 오류가 발생했습니다.`,
                variant: "destructive",
            });
        }
    }, [queries, toast]);

    useEffect(() => {
        executeQueries();
    }, dependencies);

    return {
        data,
        loading,
        errors,
        refetch: executeQueries,
        hasErrors: Object.keys(errors).length > 0
    };
};
