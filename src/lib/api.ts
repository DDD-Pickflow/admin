import { MOCK_SPOTS } from "@/mocks/spots";
import { RejectReason, Spot, SpotStatus, isPending } from "@/types/spot";

/**
 * Phase 5에서 이 파일 내부만 실제 fetch로 교체한다.
 * 화면 코드는 이 함수 시그니처만 알면 되므로 갈아끼울 때 UI를 건드릴 일이 없다.
 */

const USE_MOCK = true;
// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** 처리자 이름 — Phase 6(로그인) 붙이면 로그인 사용자로 교체된다 */
const CURRENT_HANDLER = "관리자";

/** 목 데이터는 승인/반려로 바뀌므로 원본 배열을 그대로 쓰지 않고 사본을 보관한다 */
let mockStore: Spot[] = MOCK_SPOTS;

export async function fetchSpots(): Promise<Spot[]> {
  if (USE_MOCK) return delay(mockStore.map((s) => ({ ...s })));
  throw new Error("Phase 5: GET /spots 연동 필요");
}

export async function fetchSpot(id: string): Promise<Spot> {
  if (USE_MOCK) {
    const found = mockStore.find((s) => s.id === id);
    if (!found) throw new Error(`스팟을 찾을 수 없습니다: ${id}`);
    return delay({ ...found });
  }
  throw new Error("Phase 5: GET /spots/:id 연동 필요");
}

export async function approveSpot(id: string): Promise<void> {
  if (USE_MOCK) {
    updateMockSpot(id, (spot) => ({
      ...spot,
      status: SpotStatus.APPROVED,
      handlerName: CURRENT_HANDLER,
      handledAt: new Date().toISOString(),
    }));
    return delay(undefined);
  }
  throw new Error(`Phase 5: POST /spots/${id}/approve 연동 필요`);
}

export async function rejectSpot(
  id: string,
  payload: { reason: RejectReason; detail?: string }
): Promise<void> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    updateMockSpot(id, (spot) => ({
      ...spot,
      status: SpotStatus.REJECTED,
      handlerName: CURRENT_HANDLER,
      handledAt: now,
      // 최신순이므로 앞에 붙인다
      rejectionHistory: [
        {
          reason: payload.reason,
          detail: payload.detail,
          handlerName: CURRENT_HANDLER,
          rejectedAt: now,
        },
        ...spot.rejectionHistory,
      ],
    }));
    return delay(undefined);
  }
  throw new Error(`Phase 5: POST /spots/${id}/reject 연동 필요`);
}

/** 이미 처리된 건(409)을 화면에서 구분하기 위한 에러 타입 — 기획서 7.2 */
export class AlreadyHandledError extends Error {
  constructor() {
    super("이미 처리된 건입니다.");
    this.name = "AlreadyHandledError";
  }
}

/** 목 데이터 한 건을 새 객체로 교체한다 (참조가 바뀌어야 목록이 다시 그려진다) */
function updateMockSpot(id: string, patch: (spot: Spot) => Spot): void {
  const index = mockStore.findIndex((s) => s.id === id);
  if (index < 0) throw new Error(`스팟을 찾을 수 없습니다: ${id}`);
  // 서버가 409를 주는 상황을 목에서도 동일하게 재현 (화면 대응은 Phase 7)
  if (!isPending(mockStore[index].status)) throw new AlreadyHandledError();

  mockStore = mockStore.map((s, i) => (i === index ? patch(s) : s));
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
