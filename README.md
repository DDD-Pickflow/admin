# Pickflow Admin

스팟 등록 신청 검수용 어드민 페이지. 개발 계획은 [스팟검수-어드민-개발계획.md](./스팟검수-어드민-개발계획.md), 서버 확인 항목은 [서버-API-확인요청.md](./서버-API-확인요청.md) 참고.

## 스택

Next.js(App Router) · TypeScript · Mantine v7 · TanStack Query

인증은 별도 라이브러리 없이 카카오 OAuth + 서버 발급 JWT(Bearer)로 직접 구현했다.

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
```

기본값은 **목 데이터 + 로그인 필요**다. 로그인 없이 화면만 보려면 `.env.local`에 `NEXT_PUBLIC_DEMO_MODE=true`를 넣는다.

## 환경변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 서버 주소. 기본 `https://pickflow-api.us/api` (**`/api` 포함**) |
| `NEXT_PUBLIC_KAKAO_REST_API_KEY` | 카카오 REST API 키. 인가 요청·토큰 교환에 쓰인다 |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret. **서버에서만 쓰이므로 `NEXT_PUBLIC_` 금지** |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false`면 실제 API에 붙는다. 기본은 목 데이터 |
| `NEXT_PUBLIC_DEMO_MODE` | `true`면 로그인을 건너뛴다. 목 데이터일 때만 유효 |

두 스위치는 `src/lib/config.ts`에서 묶여 있다. 목 데이터를 끄면 로그인 건너뛰기도 자동으로 꺼지므로, 실데이터가 인증 없이 열리는 조합은 만들어지지 않는다.

`NEXT_PUBLIC_` 변수는 빌드 시점에 코드에 박힌다. **값을 바꾸면 반드시 재배포**해야 하며, Vercel에서는 빌드 캐시를 끄고 Redeploy 해야 한다. 서버 주소와 목 데이터 여부는 재배포 없이 **`/settings`에서 브라우저별로 덮어쓸 수 있다**(아래 참고).

## 개발자 설정 (`/settings`)

개발 서버와 운영 서버를 오가며 확인하려고 둔 화면이다. 헤더 오른쪽 톱니 아이콘으로 들어간다.

| 항목 | 내용 |
|---|---|
| API 서버 | 개발 `https://dev-api.pickflow-api.us/api` / 운영 `https://pickflow-api.us/api` 중 선택 |
| 목 데이터 사용 | 끄면 위에서 고른 서버로 실제 요청을 보낸다 |

- 값은 **localStorage에만** 저장된다. 이 브라우저에서만 유효하고 배포 설정이나 다른 사람의 화면은 바뀌지 않는다.
- 적용하면 **새로고침**한다. 이전 서버의 응답이 TanStack Query 캐시에 남아 있으면 어느 쪽 데이터인지 알 수 없기 때문이다.
- 서버를 바꾸면 **세션을 지운다**. 토큰은 서버마다 따로 발급되므로 다시 로그인해야 한다.
- 기본값이 아닌 서버를 보고 있으면 헤더에 주황색 뱃지가 뜬다.

### 로그인 전에 여는 법

**헤더 로고("Pickflow Admin")를 1.5초 안에 연속 5번 클릭**하면 톱니 아이콘이 나타난다. 안드로이드 개발자 옵션과 같은 방식이다.

로그인 전에도 열 수 있어야 하는 이유는 순환 때문이다 — 개발 서버 로그인을 확인하려면 로그인하기 **전에** 서버를 골라야 하는데, 로그인해야만 고를 수 있으면 영영 확인할 수 없다.

| 상태 | 톱니 아이콘 | `/settings` 직접 진입 |
|---|---|---|
| 로그인함 | 보임 | 열림 |
| 로그인 안 함, 잠김 | 안 보임 | `/login`으로 돌려보냄 |
| 로그인 안 함, 로고로 열었음 | 보임 | 열림 |
| 로그인 안 함, 설정이 기본값이 아님 | 보임 | 열림 |

마지막 줄은 복구용이다. 서버를 잘못 골라 로그인이 막혀도 되돌릴 수 있어야 하는데, 그 브라우저에는 이미 값이 들어 있어 새로 노출되는 정보가 없다.

연 상태는 localStorage에 남는다. 설정 화면의 **"로그인 화면에서 숨기기"** 로 되돌린다(설정값 자체는 유지된다).

이건 눈에 안 띄게 하는 장치일 뿐 권한 제어가 아니다. 화면에 있는 정보는 서버 주소 두 개뿐이고, 설정을 바꿔도 **그 브라우저에만** 적용되며, 데이터 접근은 서버가 JWT와 `USER_ADMIN` 권한으로 막는다.
- 데모 배포(`NEXT_PUBLIC_DEMO_MODE=true`)에서는 목 데이터를 **끌 수 없다**. 로그인을 건너뛰는 상태라 실데이터가 무인증으로 열린다.

로그인 교환은 Next.js 서버 라우트를 거치므로, 브라우저가 고른 주소를 함께 보낸다. 라우트는 위 목록에 있는 주소만 받아들이고 그 외에는 환경변수 기본값을 쓴다.

## 배포 (Vercel)

| 브랜치 | 환경 | 설정 |
|---|---|---|
| `main` | Production | 로그인 필요, 목 데이터 |
| `demo` | Preview | `NEXT_PUBLIC_DEMO_MODE=true` — 로그인 없이 화면 공유용 |

`demo`는 배포 타겟일 뿐 스테이징이 아니다. **직접 커밋하지 않고 `main`을 fast-forward** 하기만 한다.

```bash
git checkout demo && git merge --ff-only main && git push && git checkout main
```

## 카카오 로그인

웹은 카카오에서 **인가 코드**를 받지만 iOS 네이티브 SDK는 **액세스 토큰**을 바로 받는다. 이 차이만 서버 라우트가 흡수하고, 백엔드에는 앱과 동일한 요청을 보내므로 **백엔드 수정이 필요 없다**.

```
브라우저 → 카카오 인증 → /auth/callback?code=...
  → POST /api/auth/kakao (Next.js 서버 라우트)
      → 카카오에 code 교환 → 카카오 액세스 토큰
      → POST /v1/auth/kakao { accessToken }   ← iOS 앱과 동일
  → 서버 JWT 저장 → 검수 목록
```

코드 → 토큰 교환에 `client_secret`이 필요한데 브라우저에 두면 안 되므로 서버 라우트에서 처리한다.

**카카오 콘솔 설정** (앱 설정 → 앱 키 → **REST API 키** 섹션. JavaScript 키가 아니다)

- 사이트 도메인: `http://localhost:3000`, `https://pickflow-admin.vercel.app`
- Redirect URI: 위 두 주소 + `/auth/callback`

**권한**: 서버가 발급하는 JWT의 `role` 클레임이 `USER_ADMIN`이어야 진입할 수 있다. 클라이언트 검사는 UX용이며 실제 차단은 서버가 한다. 검수자는 카카오로 한 번 로그인해 계정이 생성된 뒤 서버팀이 권한을 부여해야 한다.

## 서버 API 연동

`src/lib/api.ts` 한 곳에 격리되어 있어 `NEXT_PUBLIC_USE_MOCK_DATA=false`(또는 `/settings`에서 목 끄기)로 전환하면 화면 코드는 그대로 실제 API를 쓴다. 규격은 `openapi.json` 기준이다(git 제외, 서버팀 배포).

**전환 전 필요한 것**

1. **CORS 허용** — `Authorization` 헤더를 쓰므로 브라우저가 `OPTIONS` preflight를 먼저 보낸다. 이 요청은 인증 없이 가므로 **서버가 OPTIONS를 인증에서 제외**해야 한다. (2026-08 현재 401로 거부되어 미해결)
2. **`USER_ADMIN` 권한** 부여

목록·상세·승인/반려는 브라우저가 서버를 직접 호출하므로 CORS가 필요하다. 로그인만 Next.js 서버를 거치기 때문에 CORS 없이도 동작한다.

## 폴더 구조

```
src/
  app/
    layout.tsx                 루트 레이아웃
    providers.tsx              Mantine / QueryClient / Auth Provider
    icon.svg                   파비콘
    page.tsx                   "/"               검수 목록
    spots/[id]/page.tsx        "/spots/:id"      스팟 상세
    login/page.tsx             "/login"          카카오 로그인
    settings/page.tsx          "/settings"       개발자 설정 (서버 전환)
    auth/callback/page.tsx     "/auth/callback"  카카오 리다이렉트 수신
    api/auth/kakao/route.ts    인가 코드 → 서버 JWT 교환 (서버 전용)
  components/
    AppLayout.tsx              AppShell 헤더 + 좌측 메뉴
    AuthProvider.tsx           로그인 상태 컨텍스트
    AuthGuard.tsx              미인증 시 /login으로 보냄
    SpotDetail.tsx             상세 화면 본문
    SpotActions.tsx            승인/반려 버튼과 모달
    StatusBadge.tsx            상태 뱃지
    Logo.tsx / KakaoIcon.tsx   심볼
  lib/
    config.ts                  목 데이터·데모 모드 스위치 (빌드 기본값)
    devSettings.ts             서버 주소·목 여부 런타임 오버라이드
    api.ts                     데이터 접근 계층 (목/실서버 분기)
    auth.ts                    토큰 보관·재발급·로그아웃
    queries.ts                 TanStack Query 훅
    format.ts                  일시 표기
  mocks/spots.ts               목 데이터 20건
  types/spot.ts                상태·반려사유·Spot 타입
```

폴더가 곧 URL이다 — `src/app/spots/[id]/page.tsx` → `/spots/123`.

## 진행 상태

- [x] Phase 1 — 뼈대 + 목 데이터
- [x] Phase 2 — 리스트 화면
- [x] Phase 3 — 상세 검수 화면
- [x] Phase 4 — 승인/반려 모달
- [ ] Phase 5 — 서버 API 연동 *(구현 완료, CORS 해결 대기)*
- [x] Phase 6 — 로그인
- [x] Phase 7 — 예외처리 + QA

**남은 확인 항목**

- 서버: CORS preflight 401, 목록 `sort` 파라미터 지원 여부
- 기획: 반려 사유 한글명 5종, 반려 이력 표시 범위(현재 최신 1건)

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
