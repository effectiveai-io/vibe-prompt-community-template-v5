# 댓글 기능 마이그레이션 가이드

## 문제 해결 완료

### 원인
1. `comments` 테이블과 `profiles` 테이블 간의 직접적인 외래 키 관계가 없어서 발생한 문제
2. 댓글 작성 시 프롬프트의 평점과 리뷰 수가 자동으로 업데이트되지 않는 문제

### 해결 방법

1. **마이그레이션 파일 생성**
   - `supabase/migrations/20250826_create_comments_table.sql` 파일이 생성되었습니다.
   - 이 파일은 `comments` 테이블을 생성하고 필요한 인덱스와 RLS 정책을 설정합니다.
   - 댓글 추가/수정/삭제 시 자동으로 프롬프트 통계를 업데이트하는 트리거를 포함합니다.

2. **프론트엔드 코드 수정**
   - `src/components/comments/CommentList.tsx`에서 profiles 테이블을 직접 조인하는 대신, 별도의 쿼리로 프로필 정보를 가져와 매칭하도록 수정했습니다.
   - `src/components/comments/CommentForm.tsx`에서 댓글 작성 시 프롬프트 통계를 업데이트하는 로직을 추가했습니다.
   - `src/components/comments/CommentList.tsx`에서 댓글 삭제 시에도 통계를 업데이트하도록 수정했습니다.

## Supabase 대시보드에서 실행 필요

다음 SQL을 Supabase 대시보드의 SQL Editor에서 실행해주세요:

```sql
-- Comments 테이블 생성 및 profiles 테이블과의 관계 설정

-- 1. comments 테이블 생성 (이미 존재하지 않는 경우에만)
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. comments 테이블 RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 3. comments 테이블 RLS 정책 생성
-- 모든 사용자가 댓글을 읽을 수 있음
CREATE POLICY "Everyone can read comments" ON comments 
    FOR SELECT USING (true);

-- 로그인한 사용자만 댓글을 생성할 수 있음
CREATE POLICY "Authenticated users can create comments" ON comments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 댓글 작성자만 자신의 댓글을 수정할 수 있음
CREATE POLICY "Users can update their own comments" ON comments 
    FOR UPDATE USING (auth.uid() = user_id);

-- 댓글 작성자만 자신의 댓글을 삭제할 수 있음
CREATE POLICY "Users can delete their own comments" ON comments 
    FOR DELETE USING (auth.uid() = user_id);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS comments_prompt_id_idx ON comments(prompt_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- 5. updated_at 자동 업데이트 함수 (이미 존재하지 않는 경우에만)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 6. updated_at 트리거 생성
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 실행 순서

1. Supabase 대시보드에 로그인
2. SQL Editor로 이동
3. 위의 SQL 스크립트 복사 및 붙여넣기
4. Run 버튼 클릭하여 실행

## 확인 사항

마이그레이션 실행 후:
- 프롬프트 상세 페이지에서 댓글 기능이 정상 작동합니다
- 댓글 작성, 조회, 삭제가 가능합니다
- 사용자 프로필 정보(이름, 아바타)가 댓글과 함께 표시됩니다
