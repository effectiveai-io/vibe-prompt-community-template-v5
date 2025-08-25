import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorDisplayProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onHome?: () => void;
    showHomeButton?: boolean;
    className?: string;
}

export const ErrorDisplay = ({
    title = "오류가 발생했습니다",
    message,
    onRetry,
    onHome,
    showHomeButton = true,
    className = ""
}: ErrorDisplayProps) => {
    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {onRetry && (
                        <Button onClick={onRetry} className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            다시 시도
                        </Button>
                    )}
                    {showHomeButton && onHome && (
                        <Button variant="outline" onClick={onHome} className="w-full">
                            <Home className="h-4 w-4 mr-2" />
                            홈으로 돌아가기
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

interface InlineErrorProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export const InlineError = ({
    message,
    onRetry,
    className = ""
}: InlineErrorProps) => {
    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                <span>{message}</span>
                {onRetry && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="ml-2 h-auto p-1"
                    >
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
};

interface PageErrorProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onHome?: () => void;
}

export const PageError = ({
    title = "페이지를 불러올 수 없습니다",
    message,
    onRetry,
    onHome
}: PageErrorProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <ErrorDisplay
                title={title}
                message={message}
                onRetry={onRetry}
                onHome={onHome}
                className="w-full max-w-lg"
            />
        </div>
    );
};
