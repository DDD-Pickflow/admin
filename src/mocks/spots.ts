import { RejectReason, Spot, SpotStatus } from "@/types/spot";

/**
 * Phase 1~4용 목 데이터. Phase 5에서 실제 API 응답으로 교체된다.
 * 정렬 규칙을 눈으로 검증할 수 있게 상태/날짜를 일부러 뒤섞어 두었다.
 */
export const MOCK_SPOTS: Spot[] = [
  spot({ id: "1", appliedAt: "2026-07-01T09:12:00+09:00", userNickname: "산책러", name: "노을 지는 한강 계단", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "2", appliedAt: "2026-07-03T14:40:00+09:00", userNickname: "필름조아", name: "성수동 붉은 벽돌길", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "3", appliedAt: "2026-06-28T08:05:00+09:00", userNickname: "새벽러너", name: "남산 전망 벤치", status: SpotStatus.RE_REVIEW_PENDING, rejectionHistory: [rejection(RejectReason.PHOTO_QUALITY, "2026-06-29T11:00:00+09:00")] }),
  spot({ id: "4", appliedAt: "2026-07-05T19:22:00+09:00", userNickname: "야경헌터", name: "반포대교 무지개분수", status: SpotStatus.RE_REVIEW_PENDING, rejectionHistory: [rejection(RejectReason.WRONG_LOCATION, "2026-07-06T10:15:00+09:00")] }),
  spot({ id: "5", appliedAt: "2026-07-04T11:00:00+09:00", userNickname: "골목탐험", name: "익선동 한옥 골목", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "6", appliedAt: "2026-07-06T16:30:00+09:00", userNickname: "카페투어", name: "연희동 담쟁이 담벼락", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "7", appliedAt: "2026-06-25T13:10:00+09:00", userNickname: "바다보고파", name: "을왕리 일몰 포인트", status: SpotStatus.APPROVED, handlerName: "김예은", handledAt: "2026-07-02T10:00:00+09:00" }),
  spot({ id: "8", appliedAt: "2026-06-20T09:45:00+09:00", userNickname: "산책러", name: "서울숲 자작나무길", status: SpotStatus.APPROVED, handlerName: "박준현", handledAt: "2026-07-08T15:20:00+09:00" }),
  spot({ id: "9", appliedAt: "2026-06-18T18:00:00+09:00", userNickname: "빛그림", name: "이름 없는 주차장", status: SpotStatus.REJECTED, handlerName: "김예은", handledAt: "2026-07-07T09:30:00+09:00", rejectionHistory: [rejection(RejectReason.NOT_A_SPOT, "2026-07-07T09:30:00+09:00")] }),
  spot({ id: "10", appliedAt: "2026-06-22T07:30:00+09:00", userNickname: "필름조아", name: "망원 한강공원 잔디밭", status: SpotStatus.REJECTED, handlerName: "박준현", handledAt: "2026-07-01T17:45:00+09:00", rejectionHistory: [rejection(RejectReason.DUPLICATE, "2026-07-01T17:45:00+09:00")] }),
  spot({ id: "11", appliedAt: "2026-07-07T10:05:00+09:00", userNickname: "구름수집가", name: "하늘공원 억새밭", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "12", appliedAt: "2026-06-30T20:15:00+09:00", userNickname: "야경헌터", name: "롯데타워 야경 뷰포인트", status: SpotStatus.RE_REVIEW_PENDING, rejectionHistory: [rejection(RejectReason.ETC, "2026-07-02T14:00:00+09:00", "촬영일시가 등록일과 6개월 이상 차이납니다.")] }),
  spot({ id: "13", appliedAt: "2026-07-08T08:50:00+09:00", userNickname: "새벽러너", name: "북한산 백운대 능선", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "14", appliedAt: "2026-06-15T12:00:00+09:00", userNickname: "골목탐험", name: "부암동 계단길", status: SpotStatus.APPROVED, handlerName: "김예은", handledAt: "2026-06-27T11:10:00+09:00" }),
  spot({ id: "15", appliedAt: "2026-07-02T15:35:00+09:00", userNickname: "바다보고파", name: "강릉 안목해변 카페거리", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "16", appliedAt: "2026-06-12T09:00:00+09:00", userNickname: "빛그림", name: "덕수궁 돌담길", status: SpotStatus.APPROVED, handlerName: "박준현", handledAt: "2026-07-09T13:00:00+09:00" }),
  spot({ id: "17", appliedAt: "2026-07-09T17:20:00+09:00", userNickname: "카페투어", name: "을지로 노가리 골목", status: SpotStatus.UNDER_REVIEW }),
  spot({ id: "18", appliedAt: "2026-06-26T06:40:00+09:00", userNickname: "구름수집가", name: "청계천 징검다리", status: SpotStatus.REJECTED, handlerName: "김예은", handledAt: "2026-06-30T16:00:00+09:00", rejectionHistory: [rejection(RejectReason.PHOTO_QUALITY, "2026-06-30T16:00:00+09:00")] }),
  spot({ id: "19", appliedAt: "2026-06-29T21:10:00+09:00", userNickname: "산책러", name: "월드컵대교 야경", status: SpotStatus.RE_REVIEW_PENDING, rejectionHistory: [rejection(RejectReason.PHOTO_QUALITY, "2026-07-01T09:00:00+09:00")] }),
  spot({ id: "20", appliedAt: "2026-07-10T13:25:00+09:00", userNickname: "필름조아", name: "선유도공원 온실", status: SpotStatus.UNDER_REVIEW }),
];

function spot(base: Partial<Spot> & Pick<Spot, "id" | "appliedAt" | "userNickname" | "name" | "status">): Spot {
  return {
    handlerName: null,
    handledAt: null,
    photoUrls: [
      `https://picsum.photos/seed/${base.id}-1/800/600`,
      `https://picsum.photos/seed/${base.id}-2/800/600`,
    ],
    address: "서울특별시 어딘가 123-45",
    comment: "해질 무렵에 가면 빛이 제일 예뻐요.",
    shotAt: base.appliedAt,
    filters: ["노을", "산책"],
    rejectionHistory: [],
    ...base,
  };
}

function rejection(reason: RejectReason, rejectedAt: string, detail?: string) {
  return { reason, detail, handlerName: "김예은", rejectedAt };
}
