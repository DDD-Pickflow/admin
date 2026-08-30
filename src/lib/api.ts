import { MOCK_SPOTS, MockSpot, REASON_LABEL } from "@/mocks/spots";
import {
  getAccessToken,
  notifyUnauthorized,
  refreshAccessToken,
} from "@/lib/auth";
import { getApiBaseUrl, isMockData } from "@/lib/devSettings";
import {
  RejectReason,
  SpotDetail,
  SpotListItem,
  SpotListResponse,
  SpotStatus,
  isPending,
} from "@/types/spot";

/**
 * 서버 규격: openapi.json ("스팟 오픈신청 / 어드민 검수 API" v1.0.0)
 *   GET  /v1/admin/spots?status=&q=&page=&size=
 *   GET  /v1/admin/spots/{spotId}
 *   POST /v1/admin/spots/{spotId}/reviews
 *
 * 모든 응답은 ApiResponse<T> = { success, code, message, data } 로 감싸져 있다.
 * 목을 끄면 실제 API로 붙는다. 목 구현은 서버 동작(정렬·검색·필터·페이징)을
 * 그대로 흉내내므로 화면 코드는 손대지 않아도 된다.
 *
 * 목 사용 여부와 API 주소는 요청할 때마다 읽는다(devSettings). /settings 화면에서
 * 개발/운영 서버를 바꿔도 모듈을 다시 불러올 필요가 없게 하기 위한 것이다.
 * 주소는 iOS 앱이 호출하는 실제 주소 기준 — openapi.json의 servers에는 /api가 빠져 있다.
 */

/**
 * QA용 스위치. 목 데이터만으로는 실패 케이스를 만들 수 없어서 둔다.
 * 실제 API로 전환한 뒤에는 제거한다.
 */
const MOCK_FAILURE: "none" | "network" | "conflict" = "none";

export const DEFAULT_PAGE_SIZE = 20;

export interface SpotListParams {
  /** 없으면 전체 */
  status?: SpotStatus;
  q?: string;
  /** 0-base */
  page: number;
  size: number;
}

export type ReviewRequest =
  | { decision: "APPROVED" }
  | { decision: "REJECTED"; reason: RejectReason; detail?: string };

/** 서버 공통 응답 래퍼 */
interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

// ─── 공개 API ────────────────────────────────────────────────

export async function fetchSpots(
  params: SpotListParams
): Promise<SpotListResponse> {
  if (isMockData()) return mockFetchSpots(params);

  const query = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  return request<SpotListResponse>(`/v1/admin/spots?${query}`);
}

export async function fetchSpot(id: number): Promise<SpotDetail> {
  if (isMockData()) return mockFetchSpot(id);
  return request<SpotDetail>(`/v1/admin/spots/${id}`);
}

export async function reviewSpot(
  id: number,
  body: ReviewRequest
): Promise<void> {
  if (isMockData()) return mockReviewSpot(id, body);

  await request<unknown>(`/v1/admin/spots/${id}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── 에러 ────────────────────────────────────────────────────

/** 서버 공통 에러 응답을 감싼 타입 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 이미 처리된 건 — 409 / code SP004 (SPOT_ALREADY_REVIEWED) */
export class AlreadyHandledError extends ApiError {
  constructor() {
    super("이미 처리된 건입니다.", 409, "SP004");
    this.name = "AlreadyHandledError";
  }
}

// ─── 실제 HTTP ───────────────────────────────────────────────

/**
 * 401을 받으면 토큰을 한 번 재발급하고 같은 요청을 다시 보낸다.
 * 재발급까지 실패하면 화면에 알려 로그인으로 돌려보낸다.
 */
async function request<T>(
  path: string,
  init?: RequestInit,
  allowRetry = true
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...init?.headers,
      },
    });
  } catch {
    // CORS 차단과 네트워크 단절이 브라우저에서는 똑같이 TypeError로 온다.
    // 둘을 구분할 방법이 없어 양쪽을 함께 안내한다.
    throw new ApiError(
      "서버에 연결하지 못했습니다. 네트워크 상태 또는 서버의 CORS 허용 설정을 확인해주세요.",
      0
    );
  }

  const body: ApiResponse<T> | null = await response
    .json()
    .catch(() => null);

  if (response.status === 401 && allowRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, init, false);
  }

  // 서버는 실패를 HTTP 200 + success:false 로도 내려준다
  if (!response.ok || body?.success === false) {
    throw toApiError(response.status, body);
  }
  return body!.data;
}

/** 서버는 Bearer JWT + USER_ADMIN 권한을 요구한다 */
function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toApiError(status: number, body: ApiResponse<unknown> | null): ApiError {
  const code = body?.code;
  if (status === 409 && code === "SP004") return new AlreadyHandledError();

  switch (status) {
    case 401:
      // 재발급까지 실패한 경우 — 화면이 로그인으로 돌려보내도록 알린다
      notifyUnauthorized();
      return new ApiError(
        "로그인이 만료되었습니다. 다시 로그인해주세요.",
        401,
        code
      );
    case 403:
      return new ApiError("검수 권한이 없는 계정입니다.", 403, code);
    case 422:
      return new ApiError(
        body?.message ?? "요청 값이 올바르지 않습니다.",
        422,
        code
      );
    case 502:
      return new ApiError(
        "외부 연동에 실패했습니다. 잠시 후 다시 시도해주세요.",
        502,
        code
      );
    default:
      return new ApiError(
        body?.message ?? `요청에 실패했습니다 (${status})`,
        status,
        code
      );
  }
}

// ─── 목 구현 (서버 동작 재현) ─────────────────────────────────

let mockStore: MockSpot[] = MOCK_SPOTS;

/** 목 레코드에서 목록 행에 해당하는 필드만 뽑는다 */
function toListItem(spot: MockSpot): SpotListItem {
  return {
    id: spot.id,
    appliedAt: spot.appliedAt,
    userNickname: spot.userNickname,
    name: spot.name,
    status: spot.status,
    handlerName: spot.handlerName,
    handledAt: spot.handledAt,
  };
}

async function mockFetchSpots(
  params: SpotListParams
): Promise<SpotListResponse> {
  const q = params.q?.trim().toLowerCase() ?? "";
  const filtered = mockStore
    .filter((s) => s.status !== SpotStatus.DRAFT)
    .filter((s) => !params.status || s.status === params.status)
    .filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.userNickname.toLowerCase().includes(q)
    )
    .map(toListItem)
    .sort(compareByServerRule);

  const start = params.page * params.size;
  const items = filtered.slice(start, start + params.size);

  return delay({
    items,
    page: params.page,
    hasNext: start + params.size < filtered.length,
  });
}

/** 재검토대기 → 검수중(오래된순) → 승인/반려(처리일시 최신순) */
function compareByServerRule(a: SpotListItem, b: SpotListItem): number {
  const rank = (s: SpotListItem) =>
    s.status === SpotStatus.RE_REVIEW_PENDING ? 0 : isPending(s.status) ? 1 : 2;

  const diff = rank(a) - rank(b);
  if (diff !== 0) return diff;

  // 오프셋 없는 동일 포맷이라 문자열 비교로 시간순이 나온다
  if (isPending(a.status)) return a.appliedAt.localeCompare(b.appliedAt);
  return (b.handledAt ?? "").localeCompare(a.handledAt ?? "");
}

async function mockFetchSpot(id: number): Promise<SpotDetail> {
  const found = mockStore.find((s) => s.id === id);
  if (!found) throw new ApiError(`스팟을 찾을 수 없습니다: ${id}`, 404);
  return delay(toDetail(found));
}

/** 실제 상세 응답에는 처리자/처리일시가 없으므로 목에서도 빼고 내려준다 */
function toDetail(spot: MockSpot): SpotDetail {
  return {
    id: spot.id,
    name: spot.name,
    userNickname: spot.userNickname,
    status: spot.status,
    appliedAt: spot.appliedAt,
    photoUrls: spot.photoUrls,
    address: spot.address,
    latitude: spot.latitude,
    longitude: spot.longitude,
    comment: spot.comment,
    shotAt: spot.shotAt,
    theme: spot.theme,
    themeLabel: spot.themeLabel,
    rejectionHistory: spot.rejectionHistory,
    userTrust: spot.userTrust,
  };
}

async function mockReviewSpot(id: number, body: ReviewRequest): Promise<void> {
  await simulateFailure();

  const index = mockStore.findIndex((s) => s.id === id);
  if (index < 0) throw new ApiError(`스팟을 찾을 수 없습니다: ${id}`, 404);
  const current = mockStore[index];
  if (!isPending(current.status)) throw new AlreadyHandledError();

  const now = new Date().toISOString().slice(0, 19);
  const reviewed: MockSpot = { ...current, handlerName: MOCK_HANDLER, handledAt: now };
  const handled: MockSpot =
    body.decision === "APPROVED"
      ? { ...reviewed, status: SpotStatus.PUBLISHED }
      : {
          ...reviewed,
          status: SpotStatus.REJECTED,
          rejectionHistory: [
            {
              reason: body.reason,
              reasonLabel: REASON_LABEL[body.reason],
              detail: body.detail,
              handlerName: MOCK_HANDLER,
              rejectedAt: now,
            },
            ...current.rejectionHistory,
          ],
        };

  mockStore = mockStore.map((s, i) => (i === index ? handled : s));
  return delay(undefined);
}

/** 실제로는 서버가 JWT에서 식별한다. 목에서만 쓰는 값 */
const MOCK_HANDLER = "관리자";

async function simulateFailure(): Promise<void> {
  if (MOCK_FAILURE === "none") return;
  await delay(undefined);
  if (MOCK_FAILURE === "conflict") throw new AlreadyHandledError();
  throw new ApiError("네트워크에 연결할 수 없습니다.", 0);
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
