import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Search, Users, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface UserProfile {
  id: string;
  user_id: string;
  email?: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  can_sell?: boolean;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // Auth 또는 Role 로딩 중일 때는 대기
    if (authLoading || roleLoading) {
      return;
    }
    
    // 사용자가 없으면 로그인 페이지로
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // 권한 체크
    if (!isAdmin) {
      toast({
        title: "접근 거부",
        description: "관리자만 접근 가능한 페이지입니다.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    fetchUsers();
  }, [user, isAdmin, authLoading, roleLoading, navigate, toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 1. profiles 테이블에서 직접 조회 (email 필드 포함)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // 2. user_roles 정보 가져오기
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) console.error('Error fetching user roles:', rolesError);
      
      // 3. 데이터 병합
      const mergedUsers = profiles?.map(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.user_id);
        
        return {
          ...profile,
          // email 필드가 profiles 테이블에 이미 있음
          role: userRole?.role || 'user',
        };
      }) || [];
      
      setUsers(mergedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "사용자 목록 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      
      // user_roles 테이블 업데이트 또는 삽입
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      toast({
        title: "권한 업데이트 완료",
        description: "사용자 권한이 성공적으로 변경되었습니다.",
      });

      // 목록 새로고침
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "권한 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };


  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 로딩 화면
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 사용자가 없거나 권한이 없으면 null 반환 (리다이렉트는 useEffect에서 처리)
  if (!user || !isAdmin) {
    return null;
  }
  
  // 사용자 목록 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">사용자 목록 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">
            사용자 권한 관리 및 시스템 설정을 관리할 수 있습니다.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              시스템 설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>사용자 권한 관리</CardTitle>
                <CardDescription>
                  등록된 사용자의 역할과 판매 권한을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 검색 */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="이름, 사용자명, 이메일로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 사용자 테이블 */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>사용자</TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>역할</TableHead>
                        <TableHead>가입일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {user.display_name?.[0] || user.username?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {user.display_name || user.username || '익명'}
                                </p>
                                {user.username && (
                                  <p className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {user.email || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.role === 'admin' ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-700">
                                  관리자
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  (변경 불가)
                                </span>
                              </div>
                            ) : (
                              <Select
                                value={user.role}
                                onValueChange={(value) => updateUserRole(user.user_id, value)}
                                disabled={updating === user.user_id}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">
                                    <div className="flex flex-col">
                                      <span>일반 사용자</span>
                                      <span className="text-xs text-muted-foreground">무료 프롬프트만</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="seller">
                                    <div className="flex flex-col">
                                      <span>판매자</span>
                                      <span className="text-xs text-muted-foreground">유료 판매 가능</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    검색 결과가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
                <CardDescription>
                  플랫폼 전체 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>관리자 설정 안내:</strong>
                    <ol className="mt-2 ml-4 list-decimal space-y-1">
                      <li>관리자 권한은 보안상 UI에서 부여할 수 없습니다</li>
                      <li>Supabase Dashboard → SQL Editor에서 아래 쿼리 실행:</li>
                      <li className="font-mono text-sm bg-muted p-2 rounded">
                        INSERT INTO user_roles (user_id, role) 
                        VALUES ('YOUR_USER_ID', 'admin')
                        ON CONFLICT (user_id) 
                        DO UPDATE SET role = 'admin';
                      </li>
                      <li>YOUR_USER_ID는 Authentication → Users에서 확인</li>
                      <li>관리자는 다른 사용자를 일반 사용자/판매자로만 변경 가능</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="mt-6 space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">권한 체계</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <Badge className="bg-gray-100 text-gray-700">일반 사용자</Badge>
                        <div className="flex-1">
                          <p className="font-medium">기본 권한</p>
                          <ul className="text-muted-foreground mt-1 space-y-1">
                            <li>• 무료 프롬프트 등록 및 공유</li>
                            <li>• 모든 프롬프트 다운로드</li>
                            <li>• Buy Me a Coffee로 후원 받기</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Badge className="bg-blue-100 text-blue-700">판매자</Badge>
                        <div className="flex-1">
                          <p className="font-medium">판매 권한</p>
                          <ul className="text-muted-foreground mt-1 space-y-1">
                            <li>• 일반 사용자의 모든 권한</li>
                            <li>• 유료 프롬프트 등록 및 판매</li>
                            <li>• 결제 수익 받기</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Badge className="bg-purple-100 text-purple-700">관리자</Badge>
                        <div className="flex-1">
                          <p className="font-medium">전체 관리</p>
                          <ul className="text-muted-foreground mt-1 space-y-1">
                            <li>• 판매자의 모든 권한</li>
                            <li>• 사용자 역할 관리</li>
                            <li>• 시스템 설정 관리</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;