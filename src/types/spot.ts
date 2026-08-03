/** 검수 상태 — 서버가 영문 코드로 내려준다 */
export const SpotStatus = {
  /** 나만보기 — 오픈 신청 전이라 어드민 목록에 노출되지 않는다 */
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  RE_REVIEW_PENDING: "RE_REVIEW_PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
} as const;

export type SpotStatus = (typeof SpotStatus)[keyof typeof SpotStatus];

export const SPOT_STATUS_LABEL: Record<SpotStatus, string> = {
  [SpotStatus.DRAFT]: "나만보기",
  [SpotStatus.PENDING]: "검수중",
  [SpotStatus.RE_REVIEW_PENDING]: "재검토대기",
  [SpotStatus.PUBLISHED]: "승인",
  [SpotStatus.REJECTED]: "반려",
};

/** 어드민 목록 필터에 노출할 상태 (DRAFT는 오픈 신청 전이라 제외) */
export const ADMIN_STATUSES: SpotStatus[] = [
  SpotStatus.PENDING,
  SpotStatus.RE_REVIEW_PENDING,
  SpotStatus.PUBLISHED,
  SpotStatus.REJECTED,
];

/** 아직 처리되지 않은 상태 — 승인/반려 버튼이 뜬다 */
export function isPending(status: SpotStatus): boolean {
  return (
    status === SpotStatus.PENDING || status === SpotStatus.RE_REVIEW_PENDING
  );
}

/** 반려 사유 코드 — SpotReviewRequest.reason enum */
export const RejectReason = {
  DUPLICATE: "DUPLICATE",
  LOW_QUALITY: "LOW_QUALITY",
  LOCATION_MISMATCH: "LOCATION_MISMATCH",
  FILTER_MISMATCH: "FILTER_MISMATCH",
  ETC: "ETC",
} as const;

export type RejectReason = (typeof RejectReason)[keyof typeof RejectReason];

/**
 * 반려 모달에 띄울 한글명.
 * 이력 표시에는 서버가 주는 reasonLabel을 쓰고, 이 맵은 '보낼 사유'를 고를 때만 쓴다.
 */
export const REJECT_REASON_LABEL: Record<RejectReason, string> = {
  [RejectReason.DUPLICATE]: "중복 등록",
  [RejectReason.LOW_QUALITY]: "사진 품질 미달",
  [RejectReason.LOCATION_MISMATCH]: "위치 정보 불일치",
  [RejectReason.FILTER_MISMATCH]: "테마 불일치",
  [RejectReason.ETC]: "기타",
};

/** 반려 모달의 선택지 순서 (서버 enum 순서) */
export const REJECT_REASONS: RejectReason[] = Object.values(RejectReason);

/** 스팟 테마(구 '필터') — 배열이 아니라 단일 코드값이다 */
export const SpotTheme = {
  SUNSET: "SUNSET",
  YUNSEUL: "YUNSEUL",
} as const;

export type SpotTheme = (typeof SpotTheme)[keyof typeof SpotTheme];

/** 반려 이력 항목 (RejectionHistoryItem) */
export interface RejectionRecord {
  reason: RejectReason;
  /** 서버가 함께 내려주는 한글명 — 화면에는 이 값을 쓴다 */
  reasonLabel: string;
  /** ETC 사유인 경우에만 채워진다 */
  detail?: string;
  handlerName: string;
  rejectedAt: string;
}

/** 등록 유저 신뢰도 (UserTrust) */
export interface UserTrust {
  joinedAt: string;
  totalRegistered: number;
  totalApproved: number;
  totalRejected: number;
}

/** 목록 행 (AdminSpotItem) — 목록에 필요한 6개 컬럼만 내려온다 */
export interface SpotListItem {
  id: number;
  appliedAt: string;
  userNickname: string;
  name: string;
  status: SpotStatus;
  /** 미처리면 null */
  handlerName: string | null;
  handledAt: string | null;
}

/**
 * 상세 (AdminSpotDetailResponse).
 * 목록 응답과 필드가 다르므로 타입을 분리한다. 상세에는 처리자/처리일시가 없다.
 */
export interface SpotDetail {
  id: number;
  name: string;
  userNickname: string;
  status: SpotStatus;
  appliedAt: string;
  /** 미승인 건은 만료되는 presigned URL(약 60분), 승인 건은 CDN 경로 */
  photoUrls: string[];
  address: string;
  /** 위치 무관 반려 판단용 */
  latitude: number;
  longitude: number;
  comment: string;
  shotAt: string;
  theme: SpotTheme;
  themeLabel: string;
  /** 과거 반려 이력 (최신순) */
  rejectionHistory: RejectionRecord[];
  userTrust?: UserTrust;
}

/**
 * 목록 응답 (AdminSpotListResponse).
 * 전체 건수·전체 페이지 수가 없고 hasNext만 주므로 이전/다음 방식으로만 페이징할 수 있다.
 */
export interface SpotListResponse {
  items: SpotListItem[];
  page: number;
  hasNext: boolean;
}
