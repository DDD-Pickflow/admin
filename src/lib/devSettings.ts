/**
 * 개발자 설정 — 이 브라우저에만 적용되는 런타임 오버라이드.
 *
 * 서버 주소는 원래 빌드 시점 환경변수(NEXT_PUBLIC_API_BASE_URL)로 고정된다.
 * 개발/운영 서버를 오가며 확인하려면 그때마다 재배포하거나 로컬 .env를 고쳐야 하는데,
 * 검수 화면을 확인하는 동안에는 그 왕복이 번거로워서 화면에서 바꿀 수 있게 뒀다.
 *
 * 값은 localStorage에만 있다 — 다른 사람의 화면이나 배포 설정에는 영향을 주지 않고,
 * 서버 렌더링 중에는 항상 환경변수 기본값이 쓰인다.
 */

import { DEMO_MODE, USE_MOCK_DATA } from "@/lib/config";

const STORAGE_KEY = "pickflow.admin.devSettings";

export interface ApiEnv {
  id: string;
  label: string;
  baseUrl: string;
}

const DEV_API_BASE_URL = "https://dev-api.pickflow-api.us/api";
const PROD_API_BASE_URL = "https://pickflow-api.us/api";

/** 환경변수로 정해진 기본 주소. 오버라이드가 없으면 이 값이 쓰인다 */
export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? PROD_API_BASE_URL;

/**
 * 고를 수 있는 서버 목록.
 *
 * 환경변수가 개발·운영 어느 쪽도 아닌 주소를 가리키면(예: 로컬 백엔드) 그 값도
 * 선택지로 넣어준다. 자유 입력을 받지 않는 이유는 이 목록이 곧 서버 라우트의
 * 허용 목록이기 때문이다 — 로그인 교환 요청을 임의 주소로 돌릴 수 없어야 한다.
 */
export const API_ENVS: ApiEnv[] = (() => {
  const envs: ApiEnv[] = [
    { id: "dev", label: "개발 서버", baseUrl: DEV_API_BASE_URL },
    { id: "prod", label: "운영 서버", baseUrl: PROD_API_BASE_URL },
  ];
  if (!envs.some((env) => env.baseUrl === DEFAULT_API_BASE_URL)) {
    envs.push({
      id: "env",
      label: "환경변수 지정",
      baseUrl: DEFAULT_API_BASE_URL,
    });
  }
  return envs;
})();

/** 서버 라우트가 프록시해도 되는 주소인지 — 목록에 없는 주소는 받지 않는다 */
export function isAllowedApiBaseUrl(url: unknown): url is string {
  return API_ENVS.some((env) => env.baseUrl === url);
}

interface StoredSettings {
  apiBaseUrl?: string;
  useMockData?: boolean;
}

function read(): StoredSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSettings) : {};
  } catch {
    return {};
  }
}

/** 지금 요청을 보낼 API 주소 */
export function getApiBaseUrl(): string {
  const stored = read().apiBaseUrl;
  // 저장값이 손상되거나 목록에서 사라진 주소면 기본값으로 되돌린다
  return isAllowedApiBaseUrl(stored) ? stored : DEFAULT_API_BASE_URL;
}

export function getApiEnv(): ApiEnv {
  const baseUrl = getApiBaseUrl();
  return API_ENVS.find((env) => env.baseUrl === baseUrl) ?? API_ENVS[0];
}

/**
 * 목 데이터로 동작하는지.
 *
 * 데모 배포에서는 끌 수 없다. 데모는 로그인을 건너뛰므로 목을 끄는 순간 실데이터가
 * 무인증으로 열린다 — config.ts가 지키는 규칙을 런타임에서도 그대로 유지한다.
 */
export function isMockData(): boolean {
  if (DEMO_MODE) return true;
  return read().useMockData ?? USE_MOCK_DATA;
}

/** 환경변수 기본값과 다른 설정이 걸려 있는지 — 화면에 표시해 헷갈리지 않게 한다 */
export function isOverridden(): boolean {
  return getApiBaseUrl() !== DEFAULT_API_BASE_URL || isMockData() !== USE_MOCK_DATA;
}

export function saveDevSettings(next: {
  apiBaseUrl: string;
  useMockData: boolean;
}): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearDevSettings(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

// ─── 로그인 전 노출 ──────────────────────────────────────────

const UNLOCK_KEY = "pickflow.admin.devUnlocked";

/**
 * 로그인하지 않은 화면에서 개발자 설정을 열 수 있는지.
 *
 * 로그인 전에도 들어갈 수 있어야 한다 — 개발 서버 로그인을 확인하려면 로그인하기
 * 전에 서버를 골라야 하는데, 로그인해야만 고를 수 있으면 서로 물린다.
 * 대신 아무나 보이지는 않게 헤더 로고 연속 클릭으로 연다(안드로이드 개발자 옵션 방식).
 *
 * 이미 기본값이 아닌 설정이 들어 있으면 잠겨 있어도 열어준다. 서버를 잘못 골라
 * 로그인이 막혔을 때 되돌릴 길이 필요하고, 그 브라우저에는 이미 값이 있다.
 *
 * 정보를 감추는 장치일 뿐 권한 제어가 아니다. 실제 데이터 접근은 서버가 JWT와
 * USER_ADMIN 권한으로 막는다.
 */
export function isDevSettingsUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(UNLOCK_KEY) === "true" || isOverridden();
}

/**
 * 로고 연속 클릭으로 연 적이 있는지.
 * isDevSettingsUnlocked()는 설정이 바뀐 것만으로도 참이 되므로 구분해서 본다 —
 * 눌러서 연 것이 아니면 다시 잠글 것도 없다.
 */
export function isUnlockFlagSet(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(UNLOCK_KEY) === "true";
}

export function unlockDevSettings(): void {
  window.localStorage.setItem(UNLOCK_KEY, "true");
}

export function lockDevSettings(): void {
  window.localStorage.removeItem(UNLOCK_KEY);
}

/** 로고를 몇 번 연속으로 눌러야 열리는지 */
export const UNLOCK_CLICKS = 5;

/** 클릭 사이 간격이 이보다 벌어지면 처음부터 다시 센다 (ms) */
export const UNLOCK_CLICK_WINDOW = 1500;
