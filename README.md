# DDD-13-iOeS-Admin

스팟 등록 신청 검수용 어드민 페이지. 개발 계획은 [스팟검수-어드민-개발계획.md](./스팟검수-어드민-개발계획.md) 참고.

## 스택

Next.js(App Router) · TypeScript · Mantine v7 · TanStack Query · Auth.js

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값은 Phase 5·6에서 채운다
npm run dev                  # http://localhost:3000
```

## 폴더 구조

```
src/
  app/
    layout.tsx            루트 레이아웃 (Mantine + Query Provider 주입)
    providers.tsx         MantineProvider / QueryClientProvider / Notifications
    page.tsx              "/"            검수 목록  (Phase 2)
    spots/[id]/page.tsx   "/spots/:id"   스팟 상세  (Phase 3~4)
  components/
    AppLayout.tsx         AppShell 헤더 + 좌측 메뉴
  lib/
    api.ts                데이터 접근 계층 — Phase 5에서 여기만 실제 API로 교체
    sort.ts               목록 복합 정렬 규칙 + 검색 매칭 (기획서 4.1)
  mocks/
    spots.ts              목 데이터 20건
  types/
    spot.ts               상태 enum, Spot / 반려사유 / 반려이력 타입
```

폴더가 곧 URL이다 — `src/app/spots/[id]/page.tsx` → `/spots/123`.

## Pickflow

### Git 협업 방식

#### Workflow

- `master(main)` - 배포 브랜치
- `develop` - 개발 브랜치
- `feature` - 기능 개발 브랜치 (1인 1피처 가정)

```
master(main) → develop → feature
```

- `master(main)`에서 `develop` 브랜치를 생성합니다.
- `develop`에서 `feature` 브랜치를 생성하여 작업합니다.
- `feature` 작업 완료 시 `develop`으로 PR을 생성합니다.

#### Commit Convention

- `[지라 티켓 번호] 자유롭게 작업한 내용 작성`

```
[PV-12] 로그인 화면 UI 구현
[PV-35] 네트워크 에러 핸들링 추가
```

#### Code Review

- **pn rule** 적용
- PR 본문 및 코멘트는 **영어**로 작성하여 소통

## 진행 상태

- [x] Phase 1 — 뼈대 + 목 데이터
- [ ] Phase 2 — 리스트 화면
- [ ] Phase 3 — 상세 검수 화면
- [ ] Phase 4 — 승인/반려 모달
- [ ] Phase 5 — 서버 API 연동
- [ ] Phase 6 — 로그인
- [ ] Phase 7 — 예외처리 + QA
