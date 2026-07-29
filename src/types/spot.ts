/** 검수 상태 (기획서 4.1) */
export const SpotStatus = {
  UNDER_REVIEW: "검수중",
  RE_REVIEW_PENDING: "재검토대기",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;

export type SpotStatus = (typeof SpotStatus)[keyof typeof SpotStatus];

/** 아직 처리되지 않은 상태 — 목록 상단에 올라간다 */
export const PENDING_STATUSES: SpotStatus[] = [
  SpotStatus.UNDER_REVIEW,
  SpotStatus.RE_REVIEW_PENDING,
];

export function isPending(status: SpotStatus): boolean {
  return PENDING_STATUSES.includes(status);
}

/** 반려 사유 5택1 (기획서 5장) */
export const RejectReason = {
  NOT_A_SPOT: "스팟으로 보기 어려움",
  PHOTO_QUALITY: "사진 품질 미달",
  WRONG_LOCATION: "위치 정보 불일치",
  DUPLICATE: "중복 등록",
  ETC: "기타",
} as const;

export type RejectReason = (typeof RejectReason)[keyof typeof RejectReason];

/** 반려 모달의 선택지 순서 */
export const REJECT_REASONS: RejectReason[] = Object.values(RejectReason);

/** 반려 이력 — 재검토 건 상단에 이전 반려 사유/시점을 보여줄 때 사용 (기획서 4.2) */
export interface RejectionRecord {
  reason: RejectReason;
  /** "기타" 선택 시 필수 입력 */
  detail?: string;
  handlerName: string;
  /** ISO 8601 */
  rejectedAt: string;
}

export interface Spot {
  id: string;
  /** 신청일시 (ISO 8601) */
  appliedAt: string;
  /** 등록 유저 닉네임 */
  userNickname: string;
  name: string;
  status: SpotStatus;
  /** 처리자 — 미처리 건은 null */
  handlerName: string | null;
  /** 처리일시 — 미처리 건은 null */
  handledAt: string | null;

  // 상세 화면 필드 (기획서 4.2)
  photoUrls: string[];
  address: string;
  comment: string;
  /** 촬영일시 (ISO 8601) */
  shotAt: string;
  filters: string[];

  /** 과거 반려 이력 (최신순). 재검토대기 건이면 최소 1건 존재 */
  rejectionHistory: RejectionRecord[];
}

/** 유저 신뢰도 — 서버 스펙 미확정 (기획서 8장). 자리만 잡아둠 */
export interface UserTrust {
  joinedAt: string;
  totalRegistered: number;
  totalApproved: number;
  totalRejected: number;
}
