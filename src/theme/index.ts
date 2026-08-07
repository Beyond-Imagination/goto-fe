/**
 * 디자인 토큰.
 *
 * 값은 Figma 파일 6Kgazwl618lYuH54wLKoyL의 Styleguide 페이지
 * (01.Typography Guide / 02. Color Guide)와 각 화면 프레임에서 그대로 옮겼습니다.
 */
export const colors = {
  /** Brand Main Color */
  primary: "#383CFF",
  primaryPressed: "#2C2FD6",
  /** Brand Sub Color */
  brandPurple: "#6200EA",
  brandYellow: "#FFD000",

  /** 피하고 싶은 조건 계열 */
  accent: "#FF6F00",
  accentPressed: "#E05F00",

  white: "#FFFFFF",
  /** Main Text Color */
  text: "#111111",
  /** Sub Text Color */
  textSecondary: "#505050",
  textTertiary: "#767676",
  /** Disabled Color */
  textDisabled: "#999999",

  /** BG — Light / Regular */
  surfaceLight: "#F7F7FB",
  surfaceRegular: "#F1F1F5",
  surfacePressed: "#E5E5EC",

  /** Line — Light / Regular */
  lineLight: "#F1F1F5",
  lineRegular: "#E5E5EC",

  /** Icon Color */
  iconMain: "#2A2A37",
  iconSub: "#81818D",
  iconDisabled: "#A5A5AF",
  /** 이동 방식 카드의 비활성 아이콘 */
  iconMuted: "#AEAEB0",

  chipBlueBorder: "rgba(56, 60, 255, 0.5)",
  chipBlueText: "#7E81FF",
  chipOrangeBorder: "#FFCDA7",
  chipOrangeText: "#FF8D36",

  toggleOn: "#2962FF",
  toggleOff: "#A5ADB8",

  dotInactive: "#E5E5EC",

  /** 고대비 미리보기 */
  contrastText: "#000000",
  contrastBody: "#3A3A40"
} as const;

export const spacing = {
  /** 시안의 좌우 여백: 390 - 326 = 64 → 32씩 */
  screenX: 32,
  gap: 12,
  section: 32
} as const;

export const radius = {
  card: 16,
  button: 14,
  pill: 999
} as const;

/** Pretendard(SIL OFL)를 번들해 사용합니다. RN은 weight 매핑을 안 해줘서 패밀리를 직접 지정합니다. */
export const fonts = {
  regular: "Pretendard-Regular",
  medium: "Pretendard-Medium",
  semibold: "Pretendard-SemiBold"
} as const;

/** Figma의 fontSize / lineHeightPx / letterSpacing을 그대로 옮긴 텍스트 스타일. */
export const typography = {
  /** 화면 제목 */
  screenTitle: {
    fontFamily: fonts.semibold,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 41.6
  },
  /** 화면 안 섹션 제목 */
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 28,
    letterSpacing: -0.7,
    lineHeight: 36.4
  },
  /** 상단 네비게이션 제목 */
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    letterSpacing: -0.5,
    lineHeight: 28
  },
  /** 제목 아래 설명 */
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 26.1
  },
  /** 리스트 행 제목 */
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 26.1
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: -0.4,
    lineHeight: 22.4
  },
  chip: {
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: -0.35,
    lineHeight: 20
  },
  /** 보조 설명, 카드 라벨, 건너뛰기 */
  caption: {
    fontFamily: fonts.regular,
    fontSize: 14,
    letterSpacing: -0.35,
    lineHeight: 20.3
  },
  toggleLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 16
  }
} as const;
