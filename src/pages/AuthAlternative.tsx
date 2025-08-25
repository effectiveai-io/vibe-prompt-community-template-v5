import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateUserAvatar } from '@/lib/avatar';

// 대체 회원가입 방법 - 최소한의 정보로 시도
const AuthAlternative = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // 로그인 폼
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // 회원가입 폼
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: 최소 정보로 회원가입 시도
      console.log('Attempting signup with minimal info...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          // 메타데이터를 최소화
          data: {
            name: displayName || signupEmail.split('@')[0]
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // 특정 에러 처리
        if (authError.message.includes('Database error')) {
          // Database error가 발생하면 다른 방법 시도
          console.log('Trying alternative approach...');
          
          // Admin API를 통한 회원가입은 불가능하므로
          // 에러 메시지를 더 명확하게 표시
          throw new Error(
            '회원가입 시스템에 문제가 있습니다. ' +
            'Supabase Dashboard에서 다음을 확인해주세요:\n' +
            '1. Authentication → Settings → Email Auth 활성화\n' +
            '2. Database → Functions에서 트리거 확인\n' +
            '3. SQL Editor에서 제공된 스크립트 실행'
          );
        }
        
        throw authError;
      }

      if (authData.user) {
        console.log('User created:', authData.user.id);
        
        // Step 2: 프로필 생성 (비동기, 실패 허용)
        const createProfile = async () => {
          try {
            const avatarUrl = generateUserAvatar(authData.user.id);
            
            // 간단한 프로필 생성
            await supabase.from('profiles').insert({
              user_id: authData.user.id,
              email: signupEmail,
              display_name: displayName || signupEmail.split('@')[0],
              username: signupEmail.split('@')[0] + '_' + Date.now(), // 유니크한 username
              avatar_url: avatarUrl
            });
            
            console.log('Profile created');
          } catch (err) {
            console.log('Profile creation failed (non-critical):', err);
          }
        };
        
        // 비동기로 프로필 생성
        createProfile();
        
        toast({
          title: "회원가입 성공",
          description: "계정이 생성되었습니다. 로그인해주세요.",
        });
        
        // 자동으로 로그인 탭으로 전환
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Prompt Market</CardTitle>
          <CardDescription className="text-center">
            대체 인증 페이지 (문제 해결용)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">이메일</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '처리 중...' : '로그인'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="최소 6자 이상"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">표시 이름 (선택)</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="홍길동"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '처리 중...' : '회원가입'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              기본 인증 페이지로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthAlternative;