import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Shuffle, Upload, Check, ChevronDown, Sparkles, Palette } from 'lucide-react';
import { generateAvatarUrl, generateInitialsAvatar, AvatarStyle, getRandomStyle, getAllStyles, popularStyles } from '@/lib/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  userName?: string;
  onAvatarUpdate?: (url: string) => void;
}

export const AvatarUpload = ({ currentAvatarUrl, userId, userName = 'User', onAvatarUpdate }: AvatarUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('notionists');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [visibleStyles, setVisibleStyles] = useState(10);
  const [activeTab, setActiveTab] = useState('popular');
  const [generatedAvatars, setGeneratedAvatars] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // 모든 스타일 목록
  const allStyles = getAllStyles();
  const displayStyles = activeTab === 'popular' ? popularStyles : allStyles;

  // 아바타 미리 생성
  useEffect(() => {
    const stylesToGenerate = displayStyles.slice(0, visibleStyles);
    const newAvatars: Record<string, string> = {};
    
    stylesToGenerate.forEach(style => {
      if (!generatedAvatars[style]) {
        newAvatars[style] = generateAvatarUrl({
          seed: userId,
          style,
          size: 80
        });
      }
    });

    if (Object.keys(newAvatars).length > 0) {
      setGeneratedAvatars(prev => ({ ...prev, ...newAvatars }));
    }
  }, [visibleStyles, displayStyles, userId, activeTab]);

  // 스타일 선택
  const selectStyle = (style: AvatarStyle) => {
    const url = generateAvatarUrl({
      seed: userId,
      style,
      size: 256
    });
    setPreviewUrl(url);
    setSelectedStyle(style);
  };

  // 랜덤 아바타 생성
  const generateRandomAvatar = () => {
    const randomStyle = getRandomStyle();
    selectStyle(randomStyle);
  };

  // 이니셜 아바타 생성
  const generateInitials = () => {
    const url = generateInitialsAvatar(userName, 256);
    setPreviewUrl(url);
    setSelectedStyle('initials');
  };

  // 더 많은 스타일 보기
  const loadMoreStyles = () => {
    setVisibleStyles(prev => Math.min(prev + 10, displayStyles.length));
  };

  // 아바타 저장
  const saveAvatar = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      // 프로필 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: previewUrl })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "프로필 이미지가 업데이트되었습니다",
        description: "새로운 아바타가 적용되었습니다.",
      });

      if (onAvatarUpdate) {
        onAvatarUpdate(previewUrl);
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error('아바타 업데이트 실패:', error);
      toast({
        title: "업데이트 실패",
        description: "프로필 이미지 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "5MB 이하의 이미지를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 탭 변경 시 초기화
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setVisibleStyles(10);
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="relative group">
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentAvatarUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>프로필 이미지 설정</DialogTitle>
              <DialogDescription>
                원하는 스타일의 아바타를 선택하거나 직접 이미지를 업로드하세요
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 왼쪽: 미리보기 */}
              <div className="lg:col-span-1">
                <Card className="sticky top-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">미리보기</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32 ring-4 ring-muted">
                      <AvatarImage src={previewUrl || currentAvatarUrl || undefined} />
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateRandomAvatar}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        랜덤
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateInitials}
                      >
                        이니셜
                      </Button>
                    </div>

                    {selectedStyle && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">선택된 스타일</p>
                        <p className="text-sm font-medium capitalize">{selectedStyle.replace(/([A-Z])/g, ' $1').trim()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* 오른쪽: 스타일 그리드 */}
              <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="popular">
                      <Sparkles className="h-4 w-4 mr-2" />
                      인기 스타일
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      <Palette className="h-4 w-4 mr-2" />
                      모든 스타일 ({allStyles.length}개)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-4">
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {displayStyles.slice(0, visibleStyles).map((style) => (
                          <button
                            key={style}
                            onClick={() => selectStyle(style)}
                            className={cn(
                              "group relative rounded-lg border-2 p-2 transition-all hover:scale-105",
                              selectedStyle === style
                                ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                                : "border-muted hover:border-primary/50"
                            )}
                          >
                            <Avatar className="h-16 w-16 mx-auto">
                              <AvatarImage src={generatedAvatars[style]} />
                              <AvatarFallback>
                                <div className="animate-pulse bg-muted rounded-full h-full w-full" />
                              </AvatarFallback>
                            </Avatar>
                            {selectedStyle === style && (
                              <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {visibleStyles < displayStyles.length && (
                        <div className="mt-6 flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMoreStyles}
                            className="w-full max-w-xs"
                          >
                            <ChevronDown className="h-4 w-4 mr-2" />
                            더 보기 ({displayStyles.length - visibleStyles}개 남음)
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* 파일 업로드 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label htmlFor="avatar-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      이미지 업로드
                    </span>
                  </Button>
                </Label>
                <span className="text-xs text-muted-foreground">
                  최대 5MB
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={saveAvatar}
                  disabled={!previewUrl || isUploading}
                >
                  {isUploading ? (
                    "저장 중..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};