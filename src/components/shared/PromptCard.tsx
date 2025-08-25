import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Edit, Trash2, Download, User } from 'lucide-react';
import { PromptWithDetails, MyPrompt } from '@/types';

// 카테고리 아이콘 및 스타일링 유틸리티 함수들
const getCategoryIcon = (slug: string) => {
    // 실제 아이콘 로직 (기존 Explore.tsx에서 가져오기)
    return Download; // 임시
};

const getCategoryGradient = (slug: string) => {
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

const getCategoryPattern = (slug: string) => {
    // 실제 패턴 로직
    return null;
};

interface BasePromptCardProps {
    onClick?: () => void;
    className?: string;
}

interface ExplorePromptCardProps extends BasePromptCardProps {
    prompt: PromptWithDetails;
    variant: 'explore';
}

interface MyPromptCardProps extends BasePromptCardProps {
    prompt: MyPrompt;
    variant: 'owned';
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
}

interface PurchasedPromptCardProps extends BasePromptCardProps {
    prompt: PromptWithDetails;
    variant: 'purchased';
}

type PromptCardProps = ExplorePromptCardProps | MyPromptCardProps | PurchasedPromptCardProps;

export const PromptCard = ({ prompt, variant, onClick, className = "", ...props }: PromptCardProps) => {
    if (variant === 'explore') {
        return <ExploreCard prompt={prompt} onClick={onClick} className={className} />;
    }

    if (variant === 'owned') {
        const { onEdit, onDelete, onView } = props as MyPromptCardProps;
        return (
            <OwnedCard
                prompt={prompt as MyPrompt}
                onClick={onClick}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                className={className}
            />
        );
    }

    if (variant === 'purchased') {
        return <PurchasedCard prompt={prompt} onClick={onClick} className={className} />;
    }

    return null;
};

const ExploreCard = ({ prompt, onClick, className }: {
    prompt: PromptWithDetails;
    onClick?: () => void;
    className?: string;
}) => {
    const CategoryIcon = getCategoryIcon(prompt.categories?.slug || '');
    const isNew = prompt.rating_count === 0;

    return (
        <Card
            className={`cursor-pointer shadow-md hover:shadow-lg hover:scale-102 transition-all duration-300 flex flex-col h-full bg-card group ${className}`}
            onClick={onClick}
        >
            {/* Image Area */}
            <div className="relative aspect-video overflow-hidden rounded-t-lg">
                <div
                    className={`w-full h-full ${getCategoryGradient(
                        prompt.categories?.slug || ''
                    )} flex items-center justify-center relative`}
                >
                    {getCategoryPattern(prompt.categories?.slug || '')}
                    <CategoryIcon className="h-10 w-10 text-white/80 z-10" />
                </div>

                {/* New Badge */}
                {isNew && (
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white hover:bg-green-600">
                            New
                        </Badge>
                    </div>
                )}

                {/* Featured Badge */}
                {prompt.is_featured && (
                    <div className="absolute top-2 left-2">
                        <Badge variant="default">추천</Badge>
                    </div>
                )}
            </div>

            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                        {prompt.title}
                    </CardTitle>
                </div>
                <CardDescription className="line-clamp-3">
                    {prompt.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    {/* Category */}
                    {prompt.categories && (
                        <Badge variant="outline" className="text-xs">
                            {prompt.categories.name}
                        </Badge>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">

                        {prompt.rating_average && prompt.rating_count > 0 && (
                            <span>⭐ {prompt.rating_average.toFixed(1)} ({prompt.rating_count})</span>
                        )}
                    </div>
                </div>

                {/* Creator and Price */}
                <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                        {/* Creator Info */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage 
                                    src={prompt.profiles.avatar_url || undefined} 
                                    alt={prompt.profiles.display_name || "Creator avatar"}
                                />
                                <AvatarFallback className="text-xs">
                                    {prompt.profiles.display_name?.[0]?.toUpperCase() || 
                                     prompt.profiles.username?.[0]?.toUpperCase() || 
                                     <User className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground">
                                {prompt.profiles.display_name || prompt.profiles.username || '익명'}
                            </span>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                            {prompt.is_free ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        무료
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <Badge variant="default" className="mb-1 bg-primary/10 text-primary">
                                        유료
                                    </Badge>
                                    <span className="font-semibold text-lg text-primary">
                                        ₩{prompt.price.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const OwnedCard = ({
    prompt,
    onClick,
    onEdit,
    onDelete,
    onView,
    className
}: {
    prompt: MyPrompt;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    className?: string;
}) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge variant="default">승인됨</Badge>;
            case 'pending':
                return <Badge variant="secondary">검토 중</Badge>;
            case 'rejected':
                return <Badge variant="destructive">거부됨</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    {getStatusBadge(prompt.status)}
                </div>
                <CardTitle className="text-xl">{prompt.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                    {prompt.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">

                        <span>{new Date(prompt.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>

                    {prompt.categories && (
                        <Badge variant="outline">{prompt.categories.name}</Badge>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={onView}>
                            <Eye className="h-4 w-4 mr-1" />
                            보기
                        </Button>
                        <Button variant="outline" size="sm" onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                        </Button>
                        <Button variant="outline" size="sm" onClick={onDelete}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            삭제
                        </Button>
                    </div>

                    <div className="text-sm">
                        {prompt.is_free ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                무료 프롬프트
                            </Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-primary/10 text-primary">
                                    유료
                                </Badge>
                                <span className="text-muted-foreground">
                                    ₩{prompt.price.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const PurchasedCard = ({
    prompt,
    onClick,
    className
}: {
    prompt: PromptWithDetails;
    onClick?: () => void;
    className?: string;
}) => {
    return (
        <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
            onClick={onClick}
        >
            <CardHeader>
                <CardTitle className="text-lg">{prompt.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                    {prompt.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {prompt.categories && (
                        <Badge variant="outline">{prompt.categories.name}</Badge>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>구매일: {new Date(prompt.created_at).toLocaleDateString('ko-KR')}</span>
                        <span>₩{prompt.price.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
