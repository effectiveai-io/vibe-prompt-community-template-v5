# 최초 어드민 설정 가이드

이 문서는 Vibe Prompt Community 플랫폼의 최초 관리자를 설정하는 방법을 안내합니다.

## 🚀 빠른 설정 (3가지 방법)

### 방법 1: 환경 변수를 통한 자동 설정 (추천)

1. 프로젝트 루트에 `.env` 파일 생성 또는 수정
```bash
VITE_INITIAL_ADMIN_EMAIL=admin@example.com
```

2. 해당 이메일로 회원가입
3. 자동으로 어드민 권한 부여됨

> **참고**: 이 기능을 활성화하려면 아래 Supabase 트리거를 먼저 설정해야 합니다.

### 방법 2: Supabase Dashboard에서 직접 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** → **Users** 탭에서 어드민으로 만들 사용자의 ID 복사
4. **Table Editor** → **user_roles** 테이블 열기
5. **Insert** 버튼 클릭하여 새 행 추가:
   - `user_id`: 복사한 사용자 ID
   - `role`: `admin`
   - `can_sell`: `true`

### 방법 3: SQL 쿼리로 설정

1. Supabase Dashboard → **SQL Editor** 이동
2. 다음 쿼리 실행:

```sql
-- 특정 이메일을 가진 사용자를 어드민으로 설정
INSERT INTO user_roles (user_id, role, can_sell)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', can_sell = true;
```

## 🔧 자동 어드민 설정을 위한 Supabase 설정

환경 변수를 통한 자동 어드민 설정을 사용하려면:

### 1. Supabase 트리거 함수 생성

SQL Editor에서 다음 쿼리 실행:

```sql
-- 자동 어드민 설정 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  initial_admin_email text;
BEGIN
  -- 환경 변수에서 초기 어드민 이메일 가져오기
  -- 실제 환경에서는 이 값을 하드코딩하거나 별도 설정 테이블 사용
  initial_admin_email := 'admin@example.com'; -- 여기에 실제 어드민 이메일 입력
  
  -- 프로필 생성
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- 첫 번째 가입자 또는 지정된 이메일인 경우 어드민 권한 부여
  IF NEW.email = initial_admin_email OR 
     (SELECT COUNT(*) FROM auth.users) = 1 THEN
    INSERT INTO public.user_roles (user_id, role, can_sell)
    VALUES (NEW.id, 'admin', true);
  ELSE
    -- 일반 사용자로 등록
    INSERT INTO public.user_roles (user_id, role, can_sell)
    VALUES (NEW.id, 'user', false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. 기존 사용자를 어드민으로 변경

이미 가입한 사용자를 어드민으로 만들려면:

```sql
-- 이메일로 사용자 찾아서 어드민으로 설정
UPDATE user_roles 
SET role = 'admin', can_sell = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## 📋 권한 레벨 설명

| 역할 | 설명 | 권한 |
|------|------|------|
| **user** | 일반 사용자 | • 무료 프롬프트 등록<br>• 프롬프트 구매<br>• Buy Me a Coffee로 후원 받기 |
| **seller** | 판매자 | • 유료 프롬프트 등록 및 판매<br>• 일반 사용자의 모든 권한 |
| **admin** | 관리자 | • 사용자 권한 관리<br>• 시스템 설정 관리<br>• 판매자의 모든 권한 |

## 🔒 보안 주의사항

1. **첫 번째 어드민은 신중하게 설정**: 최초 어드민은 다른 사용자의 권한을 관리할 수 있습니다.
2. **어드민 이메일 보호**: 환경 변수의 어드민 이메일은 안전하게 관리하세요.
3. **정기적인 권한 검토**: 어드민 페이지에서 주기적으로 사용자 권한을 검토하세요.

## 🎯 어드민 페이지 접근

어드민으로 로그인 후:
1. 우측 상단 프로필 메뉴 클릭
2. "관리자 대시보드" 선택
3. 또는 직접 `/admin` 경로로 이동

## 문제 해결

### 어드민 메뉴가 보이지 않는 경우
1. 로그아웃 후 다시 로그인
2. 브라우저 캐시 삭제
3. user_roles 테이블에서 권한 확인

### SQL 쿼리 실행 오류
1. Supabase Dashboard에서 프로젝트가 선택되었는지 확인
2. SQL Editor에서 올바른 스키마(public)가 선택되었는지 확인
3. 테이블이 이미 존재하는지 확인

## 지원

추가 도움이 필요하시면 프로젝트 관리자에게 문의하세요.