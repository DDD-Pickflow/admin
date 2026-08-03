/**
 * 어드민 인증.
 *
 * 웹은 카카오 인가 코드(code)를 받고, 코드를 액세스 토큰으로 바꾸는 일은 서버 라우트가
 * 처리한다(client secret이 필요해서 브라우저에서 못 한다). 백엔드 /v1/auth/kakao 는
 * iOS 앱과 동일하게 { accessToken }을 받으므로 수정 없이 재사용한다.
 *
 * 서버 JWT는 localStorage에 보관한다. httpOnly 쿠키가 XSS에 더 안전하지만 백엔드가
 * 쿠키를 내려주는 구조가 아니고(Bearer 토큰 방식), 사내 검수용 도구라 이 정도로 둔다.
 */

const TOKEN_KEY = "pickflow.admin.accessToken";
const REFRESH_TOKEN_KEY = "pickflow.admin.refreshToken";
const PROFILE_KEY = "pickflow.admin.profile";

/** 카카오 앱 키가 준비되기 전까지 로그인 흐름을 화면으로 확인하기 위한 스위치 */
const USE_MOCK_AUTH = false;

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

/** 검수 화면에 들어올 수 있는 역할 */
const ADMIN_ROLE = "USER_ADMIN";

export interface AdminProfile {
  userId: string;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
}

/** 권한이 없는 계정으로 로그인했을 때 */
export class NotAdminError extends Error {
  constructor(role: string | null) {
    super(
      `검수 권한이 없는 계정입니다. 관리자에게 권한 요청이 필요합니다. (현재 권한: ${role ?? "알 수 없음"})`
    );
    this.name = "NotAdminError";
  }
}

/** 카카오 인증 후 돌아올 주소 — 카카오 콘솔에 등록한 값과 정확히 같아야 한다 */
export function kakaoRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

/** api 계층이 401을 받았을 때 화면에 알리는 통로 */
export const UNAUTHORIZED_EVENT = "pickflow:unauthorized";

/** 토큰이 만료됐거나 무효할 때 호출한다 */
export function notifyUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

// ─── 토큰 보관 ───────────────────────────────────────────────

export function getAccessToken(): string | null {
  // 서버 렌더링 중에는 localStorage가 없다
  if (typeof window === "undefined") return null;

  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  // 만료된 토큰은 보낼 필요가 없다 (유효기간 24시간)
  if (isExpired(token)) {
    clearSession();
    return null;
  }
  return token;
}

export function getProfile(): AdminProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminProfile;
  } catch {
    return null;
  }
}

function saveSession(
  accessToken: string,
  refreshToken: string | null,
  profile: AdminProfile | null
): void {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (profile) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
}

export function logout(): void {
  clearSession();
}

// ─── JWT 확인 ────────────────────────────────────────────────

interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

/**
 * 서명 검증 없이 페이로드만 읽는다.
 * 화면을 미리 걸러주기 위한 용도이고, 실제 권한 판정은 서버가 한다.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRole(token: string): string | null {
  return decodeJwt(token)?.role ?? null;
}

export function isAdminToken(token: string): boolean {
  return getRole(token) === ADMIN_ROLE;
}

function isExpired(token: string): boolean {
  const exp = decodeJwt(token)?.exp;
  if (!exp) return false;
  return exp * 1000 <= Date.now();
}

// ─── 로그인 ──────────────────────────────────────────────────

/**
 * 카카오 로그인 화면으로 보낸다. 인증이 끝나면 /auth/callback 으로 코드가 돌아온다.
 * 목 모드에서는 카카오를 거치지 않고 바로 세션을 만든다.
 */
export async function startKakaoLogin(): Promise<void> {
  if (USE_MOCK_AUTH) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    saveSession(mockAdminToken(), null, {
      userId: "0",
      email: null,
      nickname: "테스트 검수자",
      profileImageUrl: null,
      provider: "KAKAO",
    });
    return;
  }

  const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!restApiKey) {
    throw new Error("카카오 REST API 키가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    client_id: restApiKey,
    redirect_uri: kakaoRedirectUri(),
    response_type: "code",
  });
  window.location.href = `${KAKAO_AUTHORIZE_URL}?${params}`;
}

/** 목 모드 여부 — 로그인 화면이 이동 없이 진입시킬지 판단할 때 쓴다 */
export function isMockAuth(): boolean {
  return USE_MOCK_AUTH;
}

/** 콜백에서 받은 인가 코드를 서버 JWT로 교환하고 저장한다 */
export async function completeKakaoLogin(code: string): Promise<void> {
  const response = await fetch("/api/auth/kakao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: kakaoRedirectUri() }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.accessToken) {
    throw new Error(body?.message ?? "로그인에 실패했습니다.");
  }

  // 서버도 막지만, 들어와서 403을 만나기 전에 여기서 걸러준다
  if (!isAdminToken(body.accessToken)) {
    throw new NotAdminError(getRole(body.accessToken));
  }

  saveSession(body.accessToken, body.refreshToken ?? null, body.profile ?? null);
}

/** 목 모드용 토큰 — 역할·만료를 실제 토큰과 같은 형태로 넣는다 */
function mockAdminToken(): string {
  const header = btoa(JSON.stringify({ alg: "none" }));
  const payload = btoa(
    JSON.stringify({
      sub: "0",
      type: "ACCESS",
      role: ADMIN_ROLE,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    })
  );
  return `${header}.${payload}.mock`;
}
