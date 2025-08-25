# 프로젝트 리팩터링 가이드

## 🎯 리팩터링 목표

이 프로젝트는 코드 중복 제거, 재사용성 향상, 유지보수성 개선을 목표로 대대적인 리팩터링을 진행했습니다.

## 📋 주요 개선사항

### 1. 타입 시스템 통합 (`src/types/index.ts`)

**이전**: 각 페이지마다 중복된 인터페이스 정의
```typescript
// Explore.tsx, PromptDetail.tsx, Collection.tsx 등에서 각각 정의
interface Prompt { ... }
interface Category { ... }
```

**개선후**: 중앙화된 타입 정의
```typescript
// src/types/index.ts
export interface BasePrompt { ... }
export interface PromptWithDetails extends BasePrompt { ... }
export interface MyPrompt extends BasePrompt { ... }
```

### 2. 인증 가드 훅 (`src/hooks/useAuthGuard.tsx`)

**이전**: 모든 보호된 페이지에서 반복되는 인증 로직
```typescript
useEffect(() => {
  if (!user) {
    navigate('/auth', { replace: true, state: { from: '/my' } });
  }
}, [user, navigate]);
```

**개선후**: 재사용 가능한 커스텀 훅
```typescript
const { isAuthenticated, isLoading, user } = useAuthGuard();
```

### 3. 데이터 페칭 훅 (`src/hooks/useSupabaseQuery.tsx`)

**이전**: 각 컴포넌트마다 중복된 로딩/에러 처리
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
// 반복적인 try-catch 블록
```

**개선후**: 통합된 데이터 페칭 솔루션
```typescript
const { data, loading, error, refetch } = useSupabaseQuery(fetchFunction);
```

### 4. 공통 UI 컴포넌트

#### 로딩 스피너 (`src/components/shared/LoadingSpinner.tsx`)
- `LoadingSpinner`: 범용 로딩 스피너
- `PageLoading`: 전체 페이지 로딩
- `SectionLoading`: 섹션별 로딩

#### 에러 표시 (`src/components/shared/ErrorDisplay.tsx`)
- `ErrorDisplay`: 범용 에러 표시
- `InlineError`: 인라인 에러 메시지
- `PageError`: 전체 페이지 에러

#### 보호된 페이지 래퍼 (`src/components/shared/ProtectedPage.tsx`)
```typescript
<ProtectedPage loadingText="인증 확인 중...">
  <YourPageContent />
</ProtectedPage>
```

#### 프롬프트 카드 (`src/components/shared/PromptCard.tsx`)
```typescript
<PromptCard 
  prompt={prompt} 
  variant="explore" // 'explore' | 'owned' | 'purchased'
  onClick={handleClick}
/>
```

### 5. 유틸리티 함수 (`src/utils/`)

#### 상수 정의 (`src/utils/constants.ts`)
- API 엔드포인트
- 라우트 경로
- UI 관련 상수
- 메시지 템플릿

#### 헬퍼 함수 (`src/utils/helpers.ts`)
- 날짜/숫자 포맷팅
- 문자열 처리
- 상태 관련 유틸리티
- 검증 함수

### 6. 배럴 익스포트

```typescript
// 간편한 임포트
import { LoadingSpinner, ErrorDisplay, ProtectedPage } from '@/components/shared';
import { useAuth, useAuthGuard, useSupabaseQuery } from '@/hooks';
import { formatDate, formatPrice, ROUTES } from '@/utils';
```

## 🚀 사용법

### 새 페이지 생성 시

1. **보호된 페이지**:
```typescript
import { ProtectedPage } from '@/components/shared';

const MyNewPage = () => {
  return (
    <ProtectedPage>
      {/* 페이지 내용 */}
    </ProtectedPage>
  );
};
```

2. **데이터 페칭**:
```typescript
import { useSupabaseQuery } from '@/hooks';

const { data, loading, error } = useSupabaseQuery(
  () => supabase.from('table').select('*'),
  [dependency1, dependency2]
);
```

3. **에러 처리**:
```typescript
import { InlineError } from '@/components/shared';

{error && <InlineError message={error} onRetry={refetch} />}
```

### 기존 페이지 마이그레이션

1. **타입 임포트 수정**:
```typescript
// 이전
interface MyPrompt { ... }

// 개선후
import { MyPrompt } from '@/types';
```

2. **인증 로직 교체**:
```typescript
// 이전
useEffect(() => {
  if (!user) navigate('/auth', ...);
}, [user]);

// 개선후
useAuthGuard();
```

3. **로딩/에러 UI 교체**:
```typescript
// 이전
{loading && <div>로딩 중...</div>}

// 개선후
{loading && <SectionLoading />}
```

## 📐 코딩 컨벤션

### 컴포넌트
- PascalCase 사용
- 단일 책임 원칙 준수
- Props 인터페이스는 컴포넌트명 + Props

### 훅
- camelCase 사용
- `use` 접두사 필수
- 반환값은 객체 형태로 구조화

### 유틸리티
- camelCase 사용
- 순수 함수로 작성
- 타입 안정성 보장

### 파일 구조
```
src/
├── components/
│   ├── shared/          # 재사용 가능한 공통 컴포넌트
│   └── ui/              # shadcn/ui 컴포넌트
├── hooks/               # 커스텀 훅
├── pages/               # 페이지 컴포넌트
├── types/               # 타입 정의
├── utils/               # 유틸리티 함수
└── integrations/        # 외부 서비스 통합
```

## 🔄 마이그레이션 체크리스트

### 페이지 컴포넌트
- [ ] 중복 타입 정의 제거
- [ ] 공통 훅 적용
- [ ] 공통 컴포넌트 사용
- [ ] 유틸리티 함수 활용
- [ ] 상수 사용

### 컴포넌트
- [ ] 재사용 가능한 props 인터페이스
- [ ] 적절한 기본값 설정
- [ ] 타입 안정성 확보

### 훅
- [ ] 의존성 배열 최적화
- [ ] 메모이제이션 적용
- [ ] 클린업 함수 구현

## 🧪 테스트 가이드

리팩터링된 컴포넌트와 훅은 다음과 같이 테스트할 수 있습니다:

1. **컴포넌트 렌더링 테스트**
2. **훅 동작 테스트**
3. **통합 테스트**
4. **에러 경계 테스트**

## 🔧 성능 최적화

### 메모이제이션
- React.memo로 컴포넌트 최적화
- useMemo/useCallback로 값/함수 최적화

### 코드 스플리팅
- 페이지별 lazy loading
- 큰 라이브러리 동적 임포트

### 번들 최적화
- Tree shaking 활용
- 불필요한 의존성 제거

## 📈 향후 개선 사항

1. **테스트 커버리지 향상**
2. **접근성 개선**
3. **SEO 최적화**
4. **PWA 기능 추가**
5. **성능 모니터링**

---

이 가이드를 따라 점진적으로 기존 코드를 리팩터링하면 더 깔끔하고 유지보수하기 쉬운 코드베이스를 구축할 수 있습니다.
