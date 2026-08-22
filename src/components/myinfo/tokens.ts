/**
 * 내 정보(마이페이지) 화면에서만 쓰는 값들.
 * 피그마 「내 정보 01~07」 프레임 실측값이며, 전역 팔레트(colors.ts)에 없는 색만 여기 둡니다.
 */
export const myInfoPalette = {
  /**
   * 확인·지도반영 태그의 초록. 전역 semantic.success(#00C853)와 다른 값이라
   * 어느 쪽이 정본인지 디자이너 확인이 필요합니다.
   */
  tagGreen: '#43A047',
  /** 「아직 있음」 태그의 앰버. semantic.warning(#FBC02D)과 다른 값입니다. */
  tagAmber: '#F9A825',
} as const;

/** 상태 태그 톤별 색. 배경은 본색에 투명도를 얹은 값(피그마 실측 8%/4%)입니다. */
export const statusTagTone = {
  green: { color: myInfoPalette.tagGreen, background: 'rgba(67,160,71,0.08)' },
  blue: { color: '#383CFF', background: 'rgba(56,60,255,0.08)' },
  amber: { color: myInfoPalette.tagAmber, background: 'rgba(249,168,37,0.04)' },
} as const;

export type StatusTagToneName = keyof typeof statusTagTone;

/** 좌우 여백. 내 정보 화면들은 온보딩과 같은 32pt 그리드를 씁니다. */
export const MY_INFO_SCREEN_X = 32;
