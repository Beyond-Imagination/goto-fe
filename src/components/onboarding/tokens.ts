/**
 * 온보딩 플로우 전용 값들.
 *
 * Styleguide 컬러 페이지에는 없고 화면 프레임(온보딩 01 / 접근성 프로필설정 3·4·5)에만
 * 등장하는 색이라, 전역 팔레트를 늘리지 않고 이 플로우 안에서만 씁니다.
 */
import { colors } from '@/styles/tokens/colors';

/** 화면 좌우 여백. 시안 프레임 폭 390 - 콘텐츠 폭 326 = 64 → 32씩. */
export const SCREEN_X = 32;

/** 버튼/링크 아래로 항상 확보할 여백. 안드로이드의 얕은 제스처 인셋을 보정합니다. */
export const BOTTOM_GAP = 42;

/** 건너뛰기 링크가 없는 화면(온보딩)은 버튼 아래를 더 띄웁니다. */
export const BOTTOM_GAP_NO_LINK = 64;

export const chipPalette = {
  blue: {
    solid: colors.brand.mainAlt,
    border: 'rgba(56, 60, 255, 0.5)',
    text: '#7E81FF',
  },
  orange: {
    solid: '#FF6F00',
    border: '#FFCDA7',
    text: '#FF8D36',
  },
} as const;

export const togglePalette = {
  on: colors.brand.main,
  off: '#A5ADB8',
} as const;

/** 이동 방식 카드의 비활성 아이콘 색. */
export const MOBILITY_ICON_MUTED = '#AEAEB0';

/** 고대비를 켰을 때 미리보기 카드에 쓰는 색. */
export const contrastPreview = {
  title: '#000000',
  body: '#3A3A40',
} as const;
