-- ============================================
-- Vibe Prompt Community - Database Schema
-- ============================================
-- 이 스크립트는 Vibe Prompt Community 프로젝트의 전체 데이터베이스 구조를 생성합니다.
-- Supabase SQL Editor에서 실행하세요.
-- ============================================

-- 1. ENUM 타입 생성
-- ============================================
CREATE TYPE app_role AS ENUM ('admin', 'seller', 'user');

-- 2. 테이블 생성
-- ============================================

-- 카테고리 테이블
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 프로필 테이블 
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    email TEXT,
    buymeacoffee_username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 프롬프트 테이블
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[],
    is_free BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    downloads_count INTEGER NOT NULL DEFAULT 0,
    rating_average NUMERIC DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 구매 내역 테이블
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 사용자 역할 테이블
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 결제 준비 테이블
CREATE TABLE IF NOT EXISTS public.payment_preparations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    order_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes')
);

-- 3. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON public.prompts(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_prompt_id ON public.purchases(prompt_id);
CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON public.comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preparations_user_id ON public.payment_preparations(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preparations_prompt_id ON public.payment_preparations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_payment_preparations_order_id ON public.payment_preparations(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_preparations_status ON public.payment_preparations(status);

-- 4. 함수 생성
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 유료 프롬프트 판매 권한 확인 함수
CREATE OR REPLACE FUNCTION public.can_sell_paid_prompts(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = $1
      AND role IN ('seller', 'admin')
    );
END;
$$;

-- 역할 확인 함수
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 사용자 이메일 동기화 함수
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- profiles 테이블에 해당 user_id가 있으면 UPDATE, 없으면 INSERT (UPSERT)
    INSERT INTO public.profiles (user_id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        )
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        email = EXCLUDED.email,
        username = COALESCE(profiles.username, EXCLUDED.username),
        display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러가 발생해도 회원가입은 계속 진행되도록 (중요!)
        RAISE WARNING 'Profile sync failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 사용자 기본 역할 추가 함수
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- user_roles 테이블에 기본 'user' 역할 추가
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING; -- 이미 역할이 있으면 무시
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러가 발생해도 회원가입은 계속 진행되도록
        RAISE WARNING 'Default role assignment failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 프롬프트 통계 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_prompt_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_prompt_id UUID;
    v_avg_rating NUMERIC(3,1);
    v_count INTEGER;
BEGIN
    -- 영향받은 prompt_id 결정
    IF TG_OP = 'DELETE' THEN
        v_prompt_id := OLD.prompt_id;
    ELSE
        v_prompt_id := NEW.prompt_id;
    END IF;

    -- 해당 프롬프트의 평점 통계 계산
    SELECT 
        ROUND(AVG(rating)::NUMERIC, 1),
        COUNT(*)::INTEGER
    INTO v_avg_rating, v_count
    FROM comments
    WHERE prompt_id = v_prompt_id
    AND rating IS NOT NULL;

    -- NULL 체크 및 기본값 설정
    IF v_avg_rating IS NULL THEN
        v_avg_rating := 0;
    END IF;
    
    IF v_count IS NULL THEN
        v_count := 0;
    END IF;

    -- prompts 테이블 업데이트
    UPDATE prompts
    SET 
        rating_average = v_avg_rating,
        rating_count = v_count,
        updated_at = NOW()
    WHERE id = v_prompt_id;

    -- 로그 출력 (디버깅용)
    RAISE NOTICE 'Updated prompt % stats - avg: %, count: %', v_prompt_id, v_avg_rating, v_count;

    RETURN NULL; -- AFTER 트리거이므로 NULL 반환
END;
$$;

-- 5. 트리거 생성
-- ============================================

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at 
    BEFORE UPDATE ON public.prompts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_preparations_updated_at 
    BEFORE UPDATE ON public.payment_preparations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 댓글 통계 업데이트 트리거
CREATE TRIGGER update_prompt_stats_on_comment_insert 
    AFTER INSERT ON public.comments 
    FOR EACH ROW 
    WHEN (NEW.rating IS NOT NULL) 
    EXECUTE FUNCTION update_prompt_stats();

CREATE TRIGGER update_prompt_stats_on_comment_update 
    AFTER UPDATE ON public.comments 
    FOR EACH ROW 
    WHEN (OLD.rating IS DISTINCT FROM NEW.rating) 
    EXECUTE FUNCTION update_prompt_stats();

CREATE TRIGGER update_prompt_stats_on_comment_delete 
    AFTER DELETE ON public.comments 
    FOR EACH ROW 
    WHEN (OLD.rating IS NOT NULL) 
    EXECUTE FUNCTION update_prompt_stats();

-- auth.users 테이블의 이메일 동기화 트리거
CREATE TRIGGER sync_email_trigger 
    AFTER INSERT OR UPDATE ON auth.users 
    FOR EACH ROW 
    EXECUTE FUNCTION public.sync_user_email();

-- auth.users 테이블의 기본 역할 추가 트리거
CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- 6. RLS (Row Level Security) 활성화
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_preparations ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 생성
-- ============================================

-- Categories 정책
CREATE POLICY "Categories are viewable by everyone" 
    ON public.categories FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage categories" 
    ON public.categories FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Profiles 정책
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Prompts 정책
CREATE POLICY "Published prompts are viewable by everyone" 
    ON public.prompts FOR SELECT 
    USING (status = 'approved');

CREATE POLICY "Users can view their own prompts" 
    ON public.prompts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "All users can create free prompts, only approved sellers can create paid prompts" 
    ON public.prompts FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND 
        (
            -- 무료 프롬프트는 모든 사용자가 생성 가능
            (price = 0 OR is_free = true) OR
            -- 유료 프롬프트는 seller 또는 admin만 생성 가능
            (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
        )
    );

CREATE POLICY "Users can update their own prompts" 
    ON public.prompts FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (
        -- 무료에서 유료로 변경시 권한 체크
        (price = 0 OR is_free = true) OR
        (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    );

CREATE POLICY "Users can delete their own prompts" 
    ON public.prompts FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all prompts" 
    ON public.prompts FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Purchases 정책
CREATE POLICY "Users can view their own purchases" 
    ON public.purchases FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases" 
    ON public.purchases FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" 
    ON public.purchases FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- User Roles 정책
CREATE POLICY "Users can view their own roles" 
    ON public.user_roles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
    ON public.user_roles FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Comments 정책
CREATE POLICY "Everyone can read comments" 
    ON public.comments FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create comments" 
    ON public.comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
    ON public.comments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
    ON public.comments FOR DELETE 
    USING (auth.uid() = user_id);

-- Payment Preparations 정책
CREATE POLICY "Users can view their own payment preparations" 
    ON public.payment_preparations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payment preparations" 
    ON public.payment_preparations FOR INSERT 
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update payment preparations" 
    ON public.payment_preparations FOR UPDATE 
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view all payment preparations" 
    ON public.payment_preparations FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. 초기 데이터 삽입
-- ============================================

-- 기본 카테고리 데이터
INSERT INTO public.categories (name, description, slug) VALUES
    ('비즈니스', '비즈니스 관련 프롬프트', 'business'),
    ('카피라이팅', '마케팅 및 광고 문구 작성', 'copywriting'),
    ('코딩', '프로그래밍 및 개발 관련', 'coding'),
    ('디자인', '디자인 아이디어 및 컨셉', 'design'),
    ('AI 아트', 'AI 이미지 생성 프롬프트', 'ai-art'),
    ('교육', '학습 및 교육 자료', 'education'),
    ('창작 글쓰기', '소설, 시, 스토리텔링', 'creative-writing')
ON CONFLICT (slug) DO NOTHING;

-- 9. 관리자 계정 설정 안내
-- ============================================
-- 주의: 아래 쿼리는 첫 관리자를 설정할 때만 사용하세요.
-- YOUR_USER_ID를 실제 사용자 ID로 교체해야 합니다.
-- 
-- 관리자 권한 부여 예시:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- ============================================
-- 설치 완료!
-- ============================================