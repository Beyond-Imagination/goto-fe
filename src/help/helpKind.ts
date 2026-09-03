/** 도움 유형. BE `kr.bi.go_to.model.help.HelpKind` enum과 1:1로 대응합니다. */
export const HELP_KIND = {
  MOBILITY_ASSIST: '이동 보조',
  DOOR_ASSIST: '문 열어주기',
  WAYFINDING: '길 안내',
  CARRY_ITEM: '물건 옮기기',
  ELEVATOR_CALL: '엘리베이터 호출',
  OTHER: '기타',
} as const;

export type HelpKind = keyof typeof HELP_KIND;

export const HELP_KINDS = Object.keys(HELP_KIND) as readonly HelpKind[];

export function helpKindLabel(kind: HelpKind): string {
  return HELP_KIND[kind];
}

/** 도우미 목록·상세에서 제목으로 쓰는 한 줄 요약. */
export function formatHelpKinds(kinds: readonly HelpKind[]): string {
  return kinds.length > 0 ? kinds.map(helpKindLabel).join(' · ') : '도움 요청';
}
