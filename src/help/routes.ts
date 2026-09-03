export const HELP_ROUTE = {
  contactFacility: '/help/contact-facility',
  nearbyRequests: '/help/nearby-requests',
  requestNearby: '/help/request-nearby',
  /** 도움 요청 2단계 — 요청 내용 작성. */
  requestDetail: '/help/request-detail',
  /** 도움 요청 3단계 — 응답 대기. */
  requestPending: '/help/request-pending',
  /** 도우미 — 요청 상세(수락 전). */
  requestReview: '/help/request-review',
  /** 도우미 — 수락 완료. */
  accepted: '/help/accepted',
} as const;
