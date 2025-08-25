import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요').max(500, '설명은 500자 이내로 입력해주세요'),
  content: z.string().min(1, '프롬프트 내용을 입력해주세요'),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  price: z.string().min(1, '가격을 선택해주세요'),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Sell = () => {
  const { user } = useAuth();
  const { canSellPaidPrompts, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
        state: { from: '/sell' }
      });
      return;
    }
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

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      setSubmitting(true);

      const price = parseInt(values.price);
      
      // 유료 프롬프트 등록 시 권한 체크
      if (price > 0 && !canSellPaidPrompts) {
        toast({
          title: "권한 없음",
          description: "유료 프롬프트를 등록하려면 판매자 권한이 필요합니다.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      const { error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          title: values.title,
          description: values.description,
          content: values.content,
          category_id: values.category_id,
          price: price,
          is_free: price === 0,
          tags: tags.length > 0 ? tags : null,
          status: 'approved',
        });

      if (error) throw error;

      toast({
        title: "프롬프트 등록 완료!",
        description: "프롬프트가 마켓에 등록되었습니다.",
      });

      navigate('/collection');
    } catch (error: any) {
      toast({
        title: "등록 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">프롬프트 판매</h1>
          <p className="text-muted-foreground">
            나만의 프롬프트를 등록하고 판매해보세요. 관리자 검토 후 마켓플레이스에 등록됩니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>프롬프트 등록</CardTitle>
            <CardDescription>
              정확하고 상세한 정보를 입력하면 더 많은 사용자에게 어필할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목</FormLabel>
                      <FormControl>
                        <Input placeholder="프롬프트의 제목을 입력하세요" {...field} />
                      </FormControl>
                      <FormDescription>
                        매력적이고 명확한 제목을 작성해주세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                      <FormDescription>
                        이 프롬프트가 어떤 용도로 사용되는지, 어떤 결과를 얻을 수 있는지 설명해주세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                      <FormDescription>
                        구매자가 사용할 실제 프롬프트 텍스트를 입력해주세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormDescription>
                        프롬프트에 가장 적합한 카테고리를 선택해주세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="가격을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">무료</SelectItem>
                          {canSellPaidPrompts && (
                            <>
                              <SelectItem value="1000">₩1,000</SelectItem>
                              <SelectItem value="2000">₩2,000</SelectItem>
                              <SelectItem value="3000">₩3,000</SelectItem>
                              <SelectItem value="4000">₩4,000</SelectItem>
                              <SelectItem value="5000">₩5,000</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {!canSellPaidPrompts && (
                        <Alert className="mt-2">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            무료 프롬프트만 등록할 수 있습니다. 유료 프롬프트를 등록하려면 판매자 권한이 필요합니다.
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormDescription>
                        {canSellPaidPrompts 
                          ? "프롬프트의 판매 가격을 선택해주세요. 무료로 설정할 수도 있습니다."
                          : "Buy Me a Coffee를 통해 후원을 받을 수 있습니다."}
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
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? '등록 중...' : '프롬프트 등록'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Sell;