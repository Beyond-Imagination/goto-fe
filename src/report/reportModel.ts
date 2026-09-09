/**
 * 제보 초안의 순수 모델. React·네이티브 모듈에 의존하지 않아
 * 화면과 테스트 양쪽에서 그대로 쓸 수 있습니다.
 */

/**
 * 제보 유형 (제보 01 화면).
 * 현재 BE에는 실외 장애물 제보 API만 있어 obstacle만 끝까지 진행됩니다.
 */
export const REPORT_KIND = {
  placeState: 'placeState',
  facilityState: 'facilityState',
  obstacle: 'obstacle',
} as const;

export type ReportKind = (typeof REPORT_KIND)[keyof typeof REPORT_KIND];

/** 업로드 전 사용자가 고른 사진. 업로드하면 URL로 바뀝니다. */
export type ReportPhoto = {
  readonly uri: string;
  readonly mimeType: string;
  readonly fileName?: string;
};

/** 한 건에 첨부할 수 있는 사진 수. */
export const MAX_PHOTOS = 3;

/** 목록에서 항목을 토글합니다. 유형·영향 대상 칩이 모두 복수 선택입니다. */
export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}
