import { MOCK_SPOTS } from "@/mocks/spots";
import { RejectReason, Spot } from "@/types/spot";

/**
 * Phase 5에서 이 파일 내부만 실제 fetch로 교체한다.
 * 화면 코드는 이 함수 시그니처만 알면 되므로 갈아끼울 때 UI를 건드릴 일이 없다.
 */

const USE_MOCK = true;
// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchSpots(): Promise<Spot[]> {
  if (USE_MOCK) return delay(MOCK_SPOTS);
  throw new Error("Phase 5: GET /spots 연동 필요");
}

export async function fetchSpot(id: string): Promise<Spot> {
  if (USE_MOCK) {
    const found = MOCK_SPOTS.find((s) => s.id === id);
    if (!found) throw new Error(`스팟을 찾을 수 없습니다: ${id}`);
    return delay(found);
  }
  throw new Error("Phase 5: GET /spots/:id 연동 필요");
}

export async function approveSpot(id: string): Promise<void> {
  if (USE_MOCK) return delay(undefined);
  throw new Error(`Phase 5: POST /spots/${id}/approve 연동 필요`);
}

export async function rejectSpot(
  id: string,
  payload: { reason: RejectReason; detail?: string }
): Promise<void> {
  if (USE_MOCK) {
    console.log("[mock] reject", id, payload);
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

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
