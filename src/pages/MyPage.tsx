import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import {
    User,
    ShoppingBag,
    Store,
    Edit3,
    Calendar,
    CreditCard,
    TrendingUp,
    Download,
    Star,
    Plus,
    Eye,
    DollarSign,
    Coffee
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    id: string;
    username: string | null;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
    buymeacoffee_username: string | null;
}

interface Purchase {
    id: string;
    created_at: string;
    price: number;
    payment_method: string | null;
    prompts: {
        id: string;
        title: string;
        description: string;
        price: number;
        categories: {
            name: string;
        } | null;
    };
}

interface UserPrompt {
    id: string;
    title: string;
    description: string;
    price: number;
    is_free: boolean;

    rating_average: number | null;
    rating_count: number;
    status: string;
    created_at: string;
    categories: {
        name: string;
    } | null;
}

const MyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [userPrompts, setUserPrompts] = useState<UserPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!user) {
            // 로그인하지 않은 사용자는 즉시 로그인 페이지로 리다이렉트
            // state를 통해 로그인 후 현재 페이지로 돌아올 수 있도록 함
            navigate('/auth', {
                replace: true,
                state: { from: '/my' }
            });
            return;
        }

        fetchUserData();
    }, [user, navigate]);

    const fetchUserData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // 프로필 정보 조회
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('프로필 조회 실패:', profileError);
            } else if (profileData) {
                setProfile(profileData);
            }

            // 구매 내역 조회
            const { data: purchaseData, error: purchaseError } = await supabase
                .from('purchases')
                .select(`
                    *,
                    prompts:prompt_id (
                        id,
                        title,
                        description,
                        price,
                        categories:category_id (
                            name
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (purchaseError) {
                console.error('구매 내역 조회 실패:', purchaseError);
            } else {
                setPurchases(purchaseData || []);
            }

            // 내가 만든 프롬프트 조회
            const { data: promptData, error: promptError } = await supabase
                .from('prompts')
                .select(`
                    *,
                    categories:category_id (
                        name
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (promptError) {
                console.error('프롬프트 조회 실패:', promptError);
            } else {
                setUserPrompts(promptData || []);
            }

        } catch (error: any) {
            console.error('사용자 데이터 조회 실패:', error);
            toast({
                title: "데이터 로드 실패",
                description: "사용자 정보를 불러오는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.price, 0);
        const totalEarned = userPrompts.reduce((sum, prompt) => sum + prompt.price, 0);

        const avgRating = userPrompts.length > 0
            ? userPrompts.reduce((sum, prompt) => sum + (prompt.rating_average || 0), 0) / userPrompts.length
            : 0;

        return {
            totalSpent,
            totalEarned,
            avgRating,
            promptCount: userPrompts.length,
            purchaseCount: purchases.length
        };
    };

    const stats = calculateStats();

    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">사용자 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">마이 페이지</h1>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* 사이드바 - 프로필 */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader className="text-center pb-2">
                                <AvatarUpload
                                    currentAvatarUrl={profile?.avatar_url}
                                    userId={user.id}
                                    userName={profile?.display_name || user.email?.split('@')[0] || '사용자'}
                                    onAvatarUpdate={(url) => {
                                        setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                                    }}
                                />
                                <CardTitle className="mt-3">
                                    {profile?.display_name || user.email?.split('@')[0] || '사용자'}
                                </CardTitle>
                                {profile?.username && (
                                    <CardDescription className="mt-1">@{profile.username}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile?.bio && (
                                    <>
                                        <div className="px-2 py-3 bg-muted/50 rounded-lg">
                                            <p className="text-sm text-muted-foreground text-center">
                                                {profile.bio}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            가입일: {new Date(user.created_at || '').toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                    
                                    {profile?.buymeacoffee_username && (
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Coffee className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                @{profile.buymeacoffee_username}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 통계 카드 */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg">내 활동</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {stats.purchaseCount}
                                        </div>
                                        <div className="text-xs text-muted-foreground">구매</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {stats.promptCount}
                                        </div>
                                        <div className="text-xs text-muted-foreground">판매</div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">총 지출</span>
                                        <span className="font-medium">₩{stats.totalSpent.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">총 수익</span>
                                        <span className="font-medium text-green-600">₩{stats.totalEarned.toLocaleString()}</span>
                                    </div>

                                    {stats.avgRating > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">평균 평점</span>
                                            <span className="font-medium flex items-center">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                                {stats.avgRating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 메인 콘텐츠 */}
                    <div className="lg:col-span-3">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">개요</TabsTrigger>
                                <TabsTrigger value="purchases">구매 내역</TabsTrigger>
                                <TabsTrigger value="prompts">내 프롬프트</TabsTrigger>
                            </TabsList>

                            {/* 개요 탭 */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <ShoppingBag className="h-8 w-8 text-blue-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">구매한 프롬프트</p>
                                                    <p className="text-2xl font-bold">{stats.purchaseCount}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <Store className="h-8 w-8 text-green-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">판매 중인 프롬프트</p>
                                                    <p className="text-2xl font-bold">{stats.promptCount}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <DollarSign className="h-8 w-8 text-emerald-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">총 수익</p>
                                                    <p className="text-2xl font-bold">₩{stats.totalEarned.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <Download className="h-8 w-8 text-purple-600" />
                                                <div className="ml-4">
                                                                                                                        <p className="text-sm font-medium text-muted-foreground">등록한 프롬프트</p>
                                                    <p className="text-2xl font-bold">{stats.promptCount}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* 최근 활동 */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>최근 활동</CardTitle>
                                        <CardDescription>최근 구매한 프롬프트와 등록한 프롬프트</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {purchases.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">최근 구매</h4>
                                                    <div className="space-y-2">
                                                        {purchases.slice(0, 3).map((purchase) => (
                                                            <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div>
                                                                    <p className="font-medium">{purchase.prompts.title}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(purchase.created_at).toLocaleDateString('ko-KR')}
                                                                    </p>
                                                                </div>
                                                                <Badge variant="outline">₩{purchase.price.toLocaleString()}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {userPrompts.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">최근 등록한 프롬프트</h4>
                                                    <div className="space-y-2">
                                                        {userPrompts.slice(0, 3).map((prompt) => (
                                                            <div key={prompt.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div>
                                                                    <p className="font-medium">{prompt.title}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(prompt.created_at).toLocaleDateString('ko-KR')}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <Badge variant={prompt.status === 'approved' ? 'default' : 'secondary'}>
                                                                        {prompt.status === 'approved' ? '승인' : '대기'}
                                                                    </Badge>
                                                                    <p className="text-sm text-muted-foreground mt-1">

                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 구매 내역 탭 */}
                            <TabsContent value="purchases" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>구매 내역</CardTitle>
                                        <CardDescription>지금까지 구매한 모든 프롬프트</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {purchases.length === 0 ? (
                                            <div className="text-center py-8">
                                                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">아직 구매한 프롬프트가 없습니다.</p>
                                                <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
                                                    프롬프트 둘러보기
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {purchases.map((purchase) => (
                                                    <div key={purchase.id} className="border rounded-lg p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold">{purchase.prompts.title}</h3>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {purchase.prompts.description}
                                                                </p>
                                                                <div className="flex items-center space-x-4 mt-2">
                                                                    {purchase.prompts.categories && (
                                                                        <Badge variant="outline">
                                                                            {purchase.prompts.categories.name}
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-sm text-muted-foreground">
                                                                        구매일: {new Date(purchase.created_at).toLocaleDateString('ko-KR')}
                                                                    </span>
                                                                    {purchase.payment_method && (
                                                                        <Badge variant="secondary">
                                                                            {purchase.payment_method}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <p className="text-lg font-bold">₩{purchase.price.toLocaleString()}</p>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="mt-2"
                                                                    onClick={() => navigate(`/prompt/${purchase.prompts.id}`)}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    보기
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 내 프롬프트 탭 */}
                            <TabsContent value="prompts" className="space-y-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>내 프롬프트</CardTitle>
                                            <CardDescription>등록한 프롬프트 관리</CardDescription>
                                        </div>
                                        <Button onClick={() => navigate('/sell')}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            새 프롬프트 등록
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        {userPrompts.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">아직 등록한 프롬프트가 없습니다.</p>
                                                <Button variant="outline" className="mt-4" onClick={() => navigate('/sell')}>
                                                    첫 프롬프트 등록하기
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {userPrompts.map((prompt) => (
                                                    <div key={prompt.id} className="border rounded-lg p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <h3 className="font-semibold">{prompt.title}</h3>
                                                                    <Badge variant={prompt.status === 'approved' ? 'default' : 'secondary'}>
                                                                        {prompt.status === 'approved' ? '승인됨' :
                                                                            prompt.status === 'pending' ? '검토 중' : '거부됨'}
                                                                    </Badge>
                                                                    {prompt.is_free && (
                                                                        <Badge variant="outline">무료</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-2">
                                                                    {prompt.description}
                                                                </p>
                                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                                    {prompt.categories && (
                                                                        <Badge variant="outline">
                                                                            {prompt.categories.name}
                                                                        </Badge>
                                                                    )}
                                                                    <span className="flex items-center">
                                                                        <Download className="h-4 w-4 mr-1" />
                                                                        {prompt.price > 0 ? `₩${prompt.price.toLocaleString()}` : '무료'}
                                                                    </span>
                                                                    {prompt.rating_average && (
                                                                        <span className="flex items-center">
                                                                            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                                                                            {prompt.rating_average.toFixed(1)} ({prompt.rating_count})
                                                                        </span>
                                                                    )}
                                                                    <span>
                                                                        등록일: {new Date(prompt.created_at).toLocaleDateString('ko-KR')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <p className="text-lg font-bold">
                                                                    {prompt.is_free ? '무료' : `₩${prompt.price.toLocaleString()}`}
                                                                </p>
                                                                <div className="flex space-x-2 mt-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => navigate(`/prompt/${prompt.id}`)}
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        보기
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={prompt.status !== 'approved'}
                                                                    >
                                                                        <Edit3 className="h-4 w-4 mr-2" />
                                                                        수정
                                                                    </Button>
                                                                </div>
                                                                {!prompt.is_free && (
                                                                    <p className="text-sm text-muted-foreground mt-2">
                                                                        가격: {prompt.price > 0 ? `₩${prompt.price.toLocaleString()}` : '무료'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyPage;
