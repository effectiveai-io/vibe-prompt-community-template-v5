import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { CommentSection } from '@/components/comments/CommentSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Download, ArrowLeft, Share2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PromptDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  rating_average: number;
  rating_count: number;

  tags: string[] | null;
  created_at: string;
  user_id: string;
  categories: { name: string; slug: string } | null;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  buymeacoffee_username: string | null;
}

const PromptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPrompt();
      if (user) {
        checkPurchaseStatus();
      }
    }
  }, [id, user]);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      setPrompt(data as any);

      // 작성자 정보 조회
      if (data && user) {
        setIsOwner(data.user_id === user.id);
        await fetchProfile(data.user_id);
      }
    } catch (error: any) {
      toast({
        title: "프롬프트 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      // 프로필이 없는 경우 무시
    }
  };

  const checkPurchaseStatus = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('prompt_id', id)
        .maybeSingle();

      if (data) {
        setHasPurchased(true);
      }
    } catch (error) {
      // 구매하지 않은 경우 에러가 발생할 수 있으므로 무시
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/auth', {
        state: { from: window.location.pathname }
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "오류",
        description: "프롬프트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (prompt.is_free) {
      // 무료 프롬프트인 경우 기존 로직 유지
      try {
        setPurchasing(true);

        // 구매 기록 생성
        const { error } = await supabase
          .from('purchases')
          .insert({
            user_id: user.id,
            prompt_id: prompt.id,
            price: prompt.price
          });

        if (error) throw error;



        setHasPurchased(true);
        toast({
          title: "다운로드 완료!",
          description: "무료 프롬프트를 성공적으로 다운로드했습니다.",
        });

        // 프롬프트 정보 새로고침
        await fetchPrompt();
      } catch (error: any) {
        toast({
          title: "다운로드 실패",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setPurchasing(false);
      }
    } else {
      // 유료 프롬프트인 경우 토스페이먼츠 결제 페이지로 이동
      const orderId = `ORDER_${prompt.id}_${Date.now()}`;
      const paymentUrl = `/payment?promptId=${prompt.id}&amount=${prompt.price}&orderId=${orderId}`;
      navigate(paymentUrl);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">프롬프트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {prompt.is_featured && (
                  <Badge variant="default">추천</Badge>
                )}
                {prompt.categories && (
                  <Badge variant="outline">{prompt.categories.name}</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{prompt.title}</h1>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{prompt.rating_average?.toFixed(1) || '0.0'}</span>
                  <span>({prompt.rating_count}개 리뷰)</span>
                </div>

                <span>
                  {new Date(prompt.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>

              <p className="text-lg text-muted-foreground mb-6">
                {prompt.description}
              </p>

              {/* 태그 */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {prompt.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* 프롬프트 내용 */}
            <Card>
              <CardHeader>
                <CardTitle>프롬프트 내용</CardTitle>
                <CardDescription>
                  {hasPurchased || isOwner ?
                    "프롬프트의 전체 내용입니다." :
                    (prompt.is_free ?
                      "무료 다운로드 후 전체 내용을 확인할 수 있습니다." :
                      "구매 후 전체 내용을 확인할 수 있습니다."
                    )
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasPurchased || isOwner ? (
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {prompt.content}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      {prompt.is_free ?
                        "무료 다운로드 버튼을 클릭하여 전체 내용을 확인하세요." :
                        `₩${prompt.price.toLocaleString()} 구매 후 전체 내용을 확인할 수 있습니다.`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 다운로드 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {prompt.is_free ? '무료 프롬프트' : `₩${prompt.price.toLocaleString()}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPurchased || isOwner ? (
                  <Button className="w-full" disabled>
                    {isOwner ? '내 프롬프트' : '다운로드 완료'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ?
                      (prompt.is_free ? '다운로드 중...' : '구매 중...') :
                      (prompt.is_free ? '무료 다운로드' : `₩${prompt.price.toLocaleString()} 구매하기`)
                    }
                  </Button>
                )}

                <div className="text-xs text-muted-foreground text-center">
                  • 즉시 다운로드 가능
                  • 개인적 사용 허가
                  {prompt.is_free ? (
                    <div>• 무료 제공</div>
                  ) : (
                    <div>• 일회성 구매</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 작성자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>작성자</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.display_name?.[0] || profile?.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {profile?.display_name || profile?.username || '익명'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{profile?.username || 'anonymous'}
                    </p>
                  </div>
                </div>

                {/* Buy Me a Coffee 버튼 - 무료 프롬프트이고 작성자가 아닌 경우에만 표시 */}
                {profile?.buymeacoffee_username && !isOwner && prompt.is_free && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://coff.ee/${profile.buymeacoffee_username}`, '_blank')}
                  >
                    ☕ Buy me a coffee
                  </Button>
                )}
                
                {/* 유료 프롬프트인 경우 안내 메시지 */}
                {!prompt.is_free && profile?.buymeacoffee_username && !isOwner && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <p>이 프롬프트는 유료 판매 상품입니다.</p>
                    <p className="mt-1">후원 기능은 무료 프롬프트에서만 이용 가능합니다.</p>
                  </div>
                )}

                {/* 작성자가 Buy Me a Coffee 계정이 없고, 무료 프롬프트인 경우만 안내 */}
                {isOwner && !profile?.buymeacoffee_username && prompt.is_free && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Buy me a coffee 계정 등록</p>
                    <p className="mb-2">후원 기능을 활성화하려면 Buy me a coffee 계정을 등록하세요.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('https://buymeacoffee.com/', '_blank')}
                    >
                      계정 만들기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="container mx-auto px-4 py-8">
          <CommentSection
            promptId={prompt.id}
            promptOwnerId={prompt.user_id}
          />
        </div>
      </main>
    </div>
  );
};

export default PromptDetail;