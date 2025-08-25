# Vibe Prompt Community - 프로젝트 가이드

## 프로젝트 개요
AI 프롬프트 마켓플레이스 플랫폼으로, 사용자들이 프롬프트를 등록, 판매, 구매할 수 있는 커뮤니티 서비스입니다.

## 기술 스택
- **프레임워크**: React 18 + TypeScript + Vite
- **UI 라이브러리**: shadcn/ui (Radix UI 기반)
- **스타일링**: Tailwind CSS
- **상태 관리**: React Query (TanStack Query)
- **라우팅**: React Router v6
- **백엔드**: Supabase (PostgreSQL + Auth + RLS)
- **폼 처리**: React Hook Form + Zod

## 프로젝트 구조
```
src/
├── components/       # UI 컴포넌트
│   ├── ui/          # shadcn/ui 컴포넌트들
│   └── BuyMeCoffeeSettings.tsx
├── hooks/           # 커스텀 훅
│   ├── useAuth.tsx  # 인증 관련 훅
│   └── use-toast.ts # 토스트 알림 훅
├── integrations/    # 외부 서비스 연동
│   └── supabase/   # Supabase 클라이언트 설정
├── pages/          # 라우트 페이지 컴포넌트
│   ├── Index.tsx   # 메인 대시보드
│   ├── Explore.tsx # 프롬프트 탐색
│   ├── Sell.tsx    # 프롬프트 등록
│   ├── Collection.tsx # 내 컬렉션
│   ├── PromptDetail.tsx # 프롬프트 상세
│   └── Auth.tsx    # 로그인/회원가입
└── lib/
    └── utils.ts    # 유틸리티 함수
```

## 핵심 기능

### 1. 인증 시스템
- Supabase Auth 기반 사용자 인증
- AuthProvider 컨텍스트로 전역 상태 관리
- 자동 세션 유지 및 갱신

### 2. 프롬프트 관리
- **등록**: 제목, 설명, 내용, 카테고리, 태그 입력
- **상태**: pending → approved/rejected
- **메타데이터**: 다운로드 수, 평점, 리뷰 수 추적

### 3. 마켓플레이스
- 카테고리별 필터링
- 정렬 옵션: 추천순, 인기순, 평점순, 최신순
- 검색 기능 (제목, 설명, 태그)
- Featured 프롬프트 강조

### 4. 사용자 역할
- **user**: 기본 사용자 (구매만 가능)
- **seller**: 판매자 (프롬프트 등록 가능)
- **admin**: 관리자 (모든 권한)

## 데이터베이스 스키마

### 주요 테이블
1. **profiles**: 사용자 프로필 정보
2. **prompts**: 프롬프트 데이터
3. **categories**: 카테고리 정보
4. **purchases**: 구매 내역
5. **user_roles**: 사용자 역할 관리

### RLS (Row Level Security) 정책
- 승인된 프롬프트만 공개 조회 가능
- 사용자는 자신의 프롬프트만 수정 가능
- 판매자/관리자만 프롬프트 등록 가능

## 개발 가이드

### 명령어
```bash
npm run dev     # 개발 서버 실행 (포트 8080)
npm run build   # 프로덕션 빌드
npm run lint    # ESLint 실행
npm run preview # 빌드 결과 미리보기
```

### 환경 설정
- Supabase URL과 API 키는 `src/integrations/supabase/client.ts`에 하드코딩
- Lovable 플랫폼과 자동 연동 설정

### 컴포넌트 규칙
1. **shadcn/ui 컴포넌트 우선 사용**
2. **한국어 UI 텍스트 사용**
3. **Tailwind CSS 클래스 기반 스타일링**
4. **React Hook Form + Zod로 폼 검증**

### 상태 관리 패턴
```typescript
// React Query 사용 예시
const { data, error, isLoading } = useQuery({
  queryKey: ['prompts'],
  queryFn: fetchPrompts
});

// Supabase 쿼리 예시
const { data, error } = await supabase
  .from('prompts')
  .select('*, categories(name)')
  .eq('status', 'approved');
```

### 토스트 알림 패턴
```typescript
const { toast } = useToast();

toast({
  title: "성공",
  description: "작업이 완료되었습니다.",
  variant: "default" // or "destructive"
});
```

## 주의사항
1. **Supabase RLS 정책 확인 필수**
2. **사용자 권한 체크 로직 필수**
3. **에러 핸들링 및 토스트 알림 제공**
4. **로딩 상태 표시 필수**

## 카테고리 스타일링
각 카테고리별로 고유한 그라디언트와 아이콘이 할당됨:
- **business**: 파란색 그라디언트 + Briefcase 아이콘
- **creative**: 보라색 그라디언트 + FileText 아이콘
- **technical**: 초록색 그라디언트 + Code 아이콘
- **marketing**: 주황색 그라디언트

## 배포
- Lovable 플랫폼 자동 배포
- GitHub 연동으로 코드 변경사항 자동 반영
- 커스텀 도메인 연결 가능