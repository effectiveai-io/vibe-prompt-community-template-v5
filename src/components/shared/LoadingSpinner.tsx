import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export const LoadingSpinner = ({
    size = 'md',
    text = "로딩 중...",
    className = ""
}: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
            {text && (
                <p className={`${textSizeClasses[size]} text-muted-foreground`}>
                    {text}
                </p>
            )}
        </div>
    );
};

interface PageLoadingProps {
    text?: string;
}

export const PageLoading = ({ text = "페이지를 불러오는 중..." }: PageLoadingProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
};

interface SectionLoadingProps {
    text?: string;
    className?: string;
}

export const SectionLoading = ({
    text = "데이터를 불러오는 중...",
    className = "py-8"
}: SectionLoadingProps) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <LoadingSpinner text={text} />
        </div>
    );
};
