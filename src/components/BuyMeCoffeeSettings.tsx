import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  buymeacoffee_username: string | null;
}

const BuyMeCoffeeSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      setUsername(data?.buymeacoffee_username || '');
    } catch (error: any) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ buymeacoffee_username: username.trim() || null })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "설정 저장 완료",
        description: "Buy me a coffee 계정이 성공적으로 업데이트되었습니다.",
      });

      await fetchProfile();
    } catch (error: any) {
      toast({
        title: "설정 저장 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy me a coffee 설정</CardTitle>
        <CardDescription>
          후원 기능을 활성화하기 위해 Buy me a coffee 계정을 등록하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Buy me a coffee 사용자명</Label>
          <Input
            id="username"
            placeholder="예: imakerjun"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            coff.ee/[사용자명] 형태로 링크가 생성됩니다
          </p>
        </div>

        {profile?.buymeacoffee_username && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">현재 후원 링크:</p>
            <a 
              href={`https://coff.ee/${profile.buymeacoffee_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              https://coff.ee/{profile.buymeacoffee_username}
            </a>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
          
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Buy me a coffee 계정이 없으신가요?</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://buymeacoffee.com/', '_blank')}
            >
              ☕ Buy me a coffee 계정 만들기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuyMeCoffeeSettings;