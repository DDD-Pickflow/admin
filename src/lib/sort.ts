import { Spot, SpotStatus, isPending } from "@/types/spot";

/**
 * 목록 정렬 규칙 (기획서 4.1)
 *  1. 미처리 건(검수중/재검토대기)이 항상 위
 *  2. 미처리 안에서는 재검토대기 우선
 *  3. 그 다음 신청일시 오래된 순
 *  4. 완료 건(승인/반려)은 처리일시 최근 순
 */
export function compareSpots(a: Spot, b: Spot): number {
  const aPending = isPending(a.status);
  const bPending = isPending(b.status);

  if (aPending !== bPending) return aPending ? -1 : 1;

  if (aPending) {
    const aRe = a.status === SpotStatus.RE_REVIEW_PENDING;
    const bRe = b.status === SpotStatus.RE_REVIEW_PENDING;
    if (aRe !== bRe) return aRe ? -1 : 1;

    // 오래된 순 (오름차순)
    return a.appliedAt.localeCompare(b.appliedAt);
  }

  // 완료 건: 처리일시 최근 순 (내림차순). 처리일시 없으면 뒤로.
  const aHandled = a.handledAt ?? "";
  const bHandled = b.handledAt ?? "";
  return bHandled.localeCompare(aHandled);
}

export function sortSpots(spots: Spot[]): Spot[] {
  return [...spots].sort(compareSpots);
}

/** 스팟명 · 닉네임 부분일치 검색 */
export function matchesQuery(spot: Spot, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    spot.name.toLowerCase().includes(q) ||
    spot.userNickname.toLowerCase().includes(q)
  );
}
