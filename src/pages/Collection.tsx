import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Edit, Eye, Trash2, Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import BuyMeCoffeeSettings from '@/components/BuyMeCoffeeSettings';

const editFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요').max(500, '설명은 500자 이내로 입력해주세요'),
  content: z.string().min(1, '프롬프트 내용을 입력해주세요'),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  price: z.string().min(1, '가격을 선택해주세요'),
});

interface MyPrompt {
  id: string;
  title: string;
  description: string;
  content: string;
  price: number;
  is_free: boolean;
  status: string;

  created_at: string;
  category_id: string;
  tags: string[] | null;
  categories: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PurchasedPrompt {
  id: string;
  created_at: string;
  prompts: {
    id: string;
    title: string;
    description: string;
    price: number;
    is_free: boolean;
    user_id: string;
    categories: { name: string } | null;
  };
}

const Collection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myPrompts, setMyPrompts] = useState<MyPrompt[]>([]);
  const [purchasedPrompts, setPurchasedPrompts] = useState<PurchasedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<MyPrompt | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      category_id: '',
      price: '0',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth', {
        replace: true,
        state: { from: '/collection' }
      });
      return;
    }
    fetchMyPrompts();
    fetchPurchasedPrompts();
    fetchCategories();
  }, [user, navigate]);

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

  const fetchMyPrompts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          categories(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPrompts(data || []);
    } catch (error: any) {
      toast({
        title: "내 프롬프트 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPurchasedPrompts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          prompts(
            id,
            title,
            description,
            price,
            is_free,
            user_id,
            categories(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchasedPrompts((data as any) || []);
    } catch (error: any) {
      toast({
        title: "구매한 프롬프트 로딩 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = (prompt: MyPrompt) => {
    setEditingPrompt(prompt);
    editForm.reset({
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      category_id: prompt.category_id,
      price: prompt.price.toString(),
    });
    setTags(prompt.tags || []);
    setEditDialogOpen(true);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!user || !editingPrompt) return;

    try {
      setSubmitting(true);

      const price = parseInt(values.price);
      const { error } = await supabase
        .from('prompts')
        .update({
          title: values.title,
          description: values.description,
          content: values.content,
          category_id: values.category_id,
          price: price,
          is_free: price === 0,
          tags: tags.length > 0 ? tags : null,
        })
        .eq('id', editingPrompt.id);

      if (error) throw error;

      toast({
        title: "수정 완료!",
        description: "프롬프트가 성공적으로 수정되었습니다.",
      });

      setEditDialogOpen(false);
      fetchMyPrompts();
    } catch (error: any) {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">검토 중</Badge>;
      case 'approved':
        return <Badge variant="default">승인됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거부됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  const handleDeletePrompt = async (promptId: string) => {
    if (!window.confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "프롬프트가 성공적으로 삭제되었습니다.",
      });

      // 프롬프트 목록 새로고침
      fetchMyPrompts();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">내 컬렉션</h1>
          <p className="text-muted-foreground">
            등록한 프롬프트와 구매한 프롬프트를 관리하세요
          </p>
        </div>

        <Tabs defaultValue="my-prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-prompts">내가 등록한 프롬프트</TabsTrigger>
            <TabsTrigger value="purchased">구매한 프롬프트</TabsTrigger>
            <TabsTrigger value="settings">후원 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="my-prompts" className="space-y-4">
            {myPrompts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">등록된 프롬프트가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">첫 번째 프롬프트를 등록해보세요</p>
                  <Button onClick={() => navigate('/sell')}>
                    프롬프트 등록하기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPrompts.map((prompt) => (
                  <Card key={prompt.id}>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/prompt/${prompt.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            보기
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPrompt(prompt)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePrompt(prompt.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchased" className="space-y-4">
            {purchasedPrompts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Download className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">구매한 프롬프트가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">마켓플레이스에서 프롬프트를 둘러보세요</p>
                  <Button onClick={() => navigate('/')}>
                    프롬프트 탐색하기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedPrompts.map((purchase) => (
                  <Card key={purchase.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="default">구매 완료</Badge>
                      </div>
                      <CardTitle className="text-xl">{purchase.prompts.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {purchase.prompts.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>구매일</span>
                          <span>{new Date(purchase.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>

                        {purchase.prompts.categories && (
                          <Badge variant="outline">{purchase.prompts.categories.name}</Badge>
                        )}

                        <Button
                          className="w-full"
                          onClick={() => navigate(`/prompt/${purchase.prompts.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          다시보기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <BuyMeCoffeeSettings />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>프롬프트 수정</DialogTitle>
              <DialogDescription>
                프롬프트 정보를 수정하세요. 수정 후 저장 버튼을 클릭하면 즉시 반영됩니다.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목</FormLabel>
                      <FormControl>
                        <Input placeholder="프롬프트의 제목을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="프롬프트에 대한 설명을 입력하세요"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>프롬프트 내용</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="실제 프롬프트 내용을 입력하세요"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="가격을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">무료</SelectItem>
                          <SelectItem value="1000">₩1,000</SelectItem>
                          <SelectItem value="2000">₩2,000</SelectItem>
                          <SelectItem value="3000">₩3,000</SelectItem>
                          <SelectItem value="4000">₩4,000</SelectItem>
                          <SelectItem value="5000">₩5,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        프롬프트의 판매 가격을 변경할 수 있습니다.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 태그 입력 */}
                <div className="space-y-3">
                  <FormLabel>태그</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="태그 입력 후 추가 버튼을 클릭하세요"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormDescription>
                    검색하기 쉽도록 관련 태그를 추가해주세요 (최대 10개)
                  </FormDescription>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Collection;