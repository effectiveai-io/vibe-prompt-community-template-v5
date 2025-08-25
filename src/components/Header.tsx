import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    User,
    Settings,
    LogOut,
    Plus,
    ShoppingBag,
    Home,
    Menu,
    Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
    rightContent?: React.ReactNode;
}

const Header = ({ rightContent }: HeaderProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isAdmin } = useUserRole();
    const { profile } = useProfile();
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast({
                title: "로그아웃 완료",
                description: "성공적으로 로그아웃되었습니다.",
            });
            navigate('/');
        } catch (error) {
            console.error('로그아웃 오류:', error);
            toast({
                title: "로그아웃 실패",
                description: "로그아웃 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleLoginClick = () => {
        navigate('/auth', {
            state: { from: window.location.pathname }
        });
    };

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                {/* 왼쪽 영역 - 로고 */}
                <h1
                    className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate('/')}
                >
                    Prompt Market
                </h1>

                {/* 오른쪽 영역 */}
                <div className="flex items-center space-x-4">
                    {/* 커스텀 오른쪽 콘텐츠 */}
                    {rightContent}

                    {/* 네비게이션 메뉴 */}
                    {user ? (
                        <>
                            {/* 데스크톱 메뉴 */}
                            <div className="hidden md:flex items-center space-x-2">
                                <Button variant="ghost" onClick={() => navigate('/')}>
                                    <Home className="h-4 w-4 mr-2" />
                                    홈
                                </Button>
                                <Button variant="ghost" onClick={() => navigate('/sell')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    판매하기
                                </Button>
                                <Button variant="ghost" onClick={() => navigate('/collection')}>
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    내 컬렉션
                                </Button>
                            </div>

                            {/* 사용자 드롭다운 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage 
                                                src={profile?.avatar_url || undefined} 
                                                alt={profile?.display_name || "User avatar"} 
                                            />
                                            <AvatarFallback>
                                                {profile?.display_name?.[0]?.toUpperCase() || 
                                                 profile?.username?.[0]?.toUpperCase() || 
                                                 user?.email?.[0]?.toUpperCase() || 
                                                 <User className="h-4 w-4" />}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <div className="flex items-center justify-start gap-2 p-2">
                                        <p className="text-sm font-medium">
                                            {profile?.display_name ||
                                                profile?.username ||
                                                user?.email?.split('@')[0] ||
                                                '사용자'}
                                        </p>
                                    </div>
                                    <DropdownMenuSeparator />

                                    {/* 모바일에서만 보이는 메뉴 */}
                                    <div className="md:hidden">
                                        <DropdownMenuItem onClick={() => navigate('/')}>
                                            <Home className="mr-2 h-4 w-4" />
                                            홈
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate('/sell')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            판매하기
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate('/collection')}>
                                            <ShoppingBag className="mr-2 h-4 w-4" />
                                            내 컬렉션
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </div>

                                    <DropdownMenuItem onClick={() => navigate('/my')}>
                                        <User className="mr-2 h-4 w-4" />
                                        마이 페이지
                                    </DropdownMenuItem>
                                    {isAdmin && (
                                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                                            <Shield className="mr-2 h-4 w-4" />
                                            관리자 대시보드
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        설정
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        로그아웃
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" onClick={() => navigate('/')}>
                                <Home className="h-4 w-4 mr-2" />
                                홈
                            </Button>
                            <Button variant="outline" onClick={handleLoginClick}>
                                로그인
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
