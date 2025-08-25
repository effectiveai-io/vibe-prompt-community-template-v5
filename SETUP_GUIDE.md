# Vibe Prompt Community - 개발 환경 셋업 가이드

이 가이드는 Vibe Prompt Community 프로젝트를 로컬 환경에서 실행하기 위한 단계별 안내서입니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [프로젝트 클론](#프로젝트-클론)
3. [Supabase 프로젝트 생성](#supabase-프로젝트-생성)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [Edge Functions 설정](#edge-functions-설정)
6. [환경 변수 설정](#환경-변수-설정)
7. [프로젝트 실행](#프로젝트-실행)
8. [관리자 계정 설정](#관리자-계정-설정)

## 사전 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Git
- Supabase 계정 (무료)

## 프로젝트 클론

```bash
git clone https://github.com/your-username/vibe-prompt-community.git
cd vibe-prompt-community
npm install
```

## Supabase 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Project name: `vibe-prompt-community`
   - Database Password: 안전한 비밀번호 설정
   - Region: 가장 가까운 지역 선택

## 데이터베이스 설정

### 방법 1: SQL Editor 사용 (권장)

1. Supabase Dashboard에서 SQL Editor 탭으로 이동
2. `supabase/schema.sql` 파일의 전체 내용을 복사
3. SQL Editor에 붙여넣기
4. "Run" 버튼 클릭하여 실행

### 방법 2: 단계별 실행

SQL Editor에서 다음 순서대로 실행:

1. **ENUM 타입 생성**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'seller', 'user');
```

2. **테이블 생성** - `supabase/schema.sql`의 테이블 생성 부분 실행

3. **함수 생성** - `supabase/schema.sql`의 함수 생성 부분 실행

4. **트리거 생성** - `supabase/schema.sql`의 트리거 생성 부분 실행

5. **RLS 활성화 및 정책 생성** - `supabase/schema.sql`의 RLS 부분 실행

6. **초기 데이터 삽입** - 카테고리 데이터 삽입

### payment_preparations 테이블 추가 (선택사항)

결제 기능을 완전히 구현하려면 다음 테이블을 추가로 생성해야 합니다:

```sql
-- 결제 준비 테이블 (Edge Functions와 연동)
CREATE TABLE IF NOT EXISTS public.payment_preparations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    order_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'confirmed', 'failed')),
    payment_key TEXT,
    payment_method TEXT,
    approved_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_payment_preparations_order_id ON public.payment_preparations(order_id);
CREATE INDEX idx_payment_preparations_user_id ON public.payment_preparations(user_id);

-- RLS 활성화
ALTER TABLE public.payment_preparations ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view their own payment preparations" 
    ON public.payment_preparations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment preparations" 
    ON public.payment_preparations FOR ALL 
    USING (auth.role() = 'service_role');
```

## Edge Functions 설정

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. 프로젝트 연결

```bash
supabase login
supabase link --project-ref your-project-ref
```

프로젝트 ref는 Supabase Dashboard의 Settings > General에서 확인 가능합니다.

### 3. Edge Functions 배포

```bash
# prepare-payment 함수 배포
supabase functions deploy prepare-payment

# confirm-payment 함수 배포
supabase functions deploy confirm-payment
```

### 4. 환경 변수 설정 (Edge Functions)

Supabase Dashboard > Edge Functions > 각 함수 > Settings에서 환경 변수 추가:

- `SUPABASE_URL`: 자동으로 설정됨
- `SUPABASE_SERVICE_ROLE_KEY`: 자동으로 설정됨

## 환경 변수 설정

### 1. Supabase 정보 가져오기

Supabase Dashboard > Settings > API에서:
- `Project URL` 복사
- `anon public` 키 복사

### 2. 프론트엔드 설정

`src/integrations/supabase/client.ts` 파일 수정:

```typescript
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
```

또는 환경 변수 파일 사용 (`.env.local`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 프로젝트 실행

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:8080 접속
```

## 관리자 계정 설정

### 1. 일반 계정으로 회원가입

1. 브라우저에서 `/auth` 페이지 접속
2. 이메일로 회원가입
3. 이메일 인증 완료

### 2. 관리자 권한 부여

Supabase Dashboard > SQL Editor에서:

```sql
-- 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 관리자 권한 부여 (위에서 확인한 ID 사용)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('확인한-USER-ID', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### 3. 판매자 권한 부여 (선택사항)

```sql
-- 판매자 권한 부여
INSERT INTO public.user_roles (user_id, role) 
VALUES ('USER-ID', 'seller')
ON CONFLICT (user_id) DO UPDATE SET role = 'seller';
```

## 주요 기능 테스트

### 1. 프롬프트 등록
- 관리자 또는 판매자 계정으로 로그인
- `/sell` 페이지에서 프롬프트 등록

### 2. 프롬프트 승인
- 관리자 계정으로 로그인
- 직접 DB에서 상태 변경:
```sql
UPDATE prompts SET status = 'approved' WHERE id = 'PROMPT_ID';
```

### 3. 결제 테스트
- 토스페이먼츠 테스트 모드 사용
- 테스트 카드번호: 4242-4242-4242-4242

## 트러블슈팅

### 1. 회원가입 시 Database error
- `supabase/schema.sql`의 `sync_user_email` 함수와 트리거 확인
- auth.users 테이블에 트리거가 제대로 생성되었는지 확인

### 2. RLS 정책 오류
- 모든 테이블에 RLS가 활성화되어 있는지 확인
- 정책이 올바르게 생성되었는지 확인

### 3. Edge Functions 오류
- Supabase Dashboard > Edge Functions > Logs 확인
- CORS 설정 확인

## 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [React 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)

## 라이선스

MIT License

## 기여하기

Pull Request는 언제나 환영합니다! 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request