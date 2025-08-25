import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, Download, Filter, FileText, Code, Briefcase, Palette, BookOpen, PenTool, TrendingUp, Sparkles, Brain, Layers, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface Prompt {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  rating_average: number;
  rating_count: number;
  tags: string[] | null;
  user_id: string;
  categories: { name: string; slug: string } | null;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Explore = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper functions for category styling
  const getCategoryGradient = (categorySlug: string) => {
    switch (categorySlug) {
      case 'business':
        return 'bg-gradient-to-br from-blue-500 to-blue-700';
      case 'copywriting':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-700';
      case 'coding':
        return 'bg-gradient-to-br from-slate-700 to-slate-900';
      case 'design':
        return 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500';
      case 'ai-art':
        return 'bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500';
      case 'education':
        return 'bg-gradient-to-br from-amber-500 to-orange-600';
      case 'creative-writing':
        return 'bg-gradient-to-br from-purple-500 to-indigo-700';
      case 'marketing':
        return 'bg-gradient-to-br from-orange-500 to-red-600';
      case 'technical':
        return 'bg-gradient-to-br from-teal-500 to-cyan-700';
      case 'creative':
        return 'bg-gradient-to-br from-violet-500 to-purple-700';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-700';
    }
  };

  const getCategoryIcon = (categorySlug: string) => {
    switch (categorySlug) {
      case 'business':
        return Briefcase;
      case 'copywriting':
        return PenTool;
      case 'coding':
        return Code;
      case 'design':
        return Layers;
      case 'ai-art':
        return Palette;
      case 'education':
        return BookOpen;
      case 'creative-writing':
        return Sparkles;
      case 'marketing':
        return TrendingUp;
      case 'technical':
        return Brain;
      case 'creative':
        return FileText;
      default:
        return FileText;
    }
  };

  const getCategoryPattern = (categorySlug: string) => {
    // 카테고리별 패턴 오버레이 (선택적)
    switch (categorySlug) {
      case 'coding':
        return (
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`,
            }} />
          </div>
        );
      case 'design':
        return (
          <div className="absolute inset-0 opacity-15">
            <div className="h-full w-full" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px)`,
            }} />
          </div>
        );
      case 'ai-art':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full" style={{
              backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            }} />
          </div>
        );
      default:
        return null;
    }
  };

  const getCategoryBadgeStyle = (categorySlug: string) => {
    switch (categorySlug) {
      case 'business':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'copywriting':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'coding':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
      case 'design':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300';
      case 'ai-art':
        return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300';
      case 'education':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      case 'creative-writing':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300';
      case 'marketing':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      case 'technical':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      case 'creative':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300';
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchCategories();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "카테고리 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('prompts')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('status', 'approved');

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      // 정렬 조건
      switch (sortBy) {
        case 'featured':
          query = query.order('is_featured', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_average', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data: promptsData, error: promptsError } = await query;

      if (promptsError) throw promptsError;

      // 각 프롬프트의 user_id로 프로필 정보 가져오기
      if (promptsData && promptsData.length > 0) {
        const userIds = [...new Set(promptsData.map(p => p.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Failed to fetch profiles:', profilesError);
        }

        // 프로필 정보를 프롬프트와 매칭
        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const promptsWithProfiles = promptsData.map(prompt => ({
          ...prompt,
          profile: profilesMap.get(prompt.user_id) || null
        }));

        setPrompts(promptsWithProfiles as any);
      } else {
        setPrompts([]);
      }
    } catch (error: any) {
      toast({
        title: "프롬프트 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">프롬프트 탐색</h2>
          <p className="text-muted-foreground mb-6">
            최고의 AI 프롬프트를 발견하고 다운로드하세요
          </p>

          {/* 검색 및 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="프롬프트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">추천순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="rating">평점순</SelectItem>
                <SelectItem value="newest">최신순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 프롬프트 목록 */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPrompts.map((prompt) => {
              const CategoryIcon = getCategoryIcon(prompt.categories?.slug || '');
              const isNew = prompt.rating_count === 0;

              return (
                <Card
                  key={prompt.id}
                  className="cursor-pointer shadow-md hover:shadow-lg hover:scale-102 transition-all duration-300 flex flex-col h-full bg-card group"
                  onClick={() => navigate(`/prompt/${prompt.id}`)}
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
                    <div className="flex items-center justify-between mb-2">
                      {/* Category Badge */}
                      {prompt.categories && (
                        <Badge
                          variant="secondary"
                          className={getCategoryBadgeStyle(prompt.categories.slug)}
                        >
                          {prompt.categories.name}
                        </Badge>
                      )}

                      {/* Price */}
                      <div className="text-right">
                        {prompt.is_free ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                            무료
                          </Badge>
                        ) : (
                          <span className="text-lg font-bold text-primary">
                            ₩{prompt.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <CardTitle className="text-base font-semibold line-clamp-2">
                      {prompt.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {prompt.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 pt-0">
                    {/* Metadata Section */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-1">
                        {prompt.rating_count > 0 ? (
                          <>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{prompt.rating_average?.toFixed(1)}</span>
                            <span>({prompt.rating_count})</span>
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span>아직 리뷰가 없습니다</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {prompt.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {prompt.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{prompt.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Creator Info */}
                    <div className="pt-3 mt-auto border-t">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage 
                            src={prompt.profile?.avatar_url || undefined} 
                            alt={prompt.profile?.display_name || "Creator avatar"}
                          />
                          <AvatarFallback className="text-xs">
                            {prompt.profile?.display_name?.[0]?.toUpperCase() || 
                             prompt.profile?.username?.[0]?.toUpperCase() || 
                             <User className="h-3 w-3" />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">
                          {prompt.profile?.display_name || prompt.profile?.username || '익명'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredPrompts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
            <p className="text-muted-foreground">
              다른 검색어나 필터를 시도해보세요
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Explore;