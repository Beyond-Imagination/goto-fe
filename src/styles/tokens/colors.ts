/**
 * Design Tokens - Color Palette
 * 피그마 스타일 가이드 & Figma Variable 스크린샷 100% 실제 데이터
 */

export const colors = {
  // Brand Colors (Main 01, Sub 01, Sub 02)
  brand: {
    main: '#2962FF',   // Main 01 (메인 브랜드 블루)
    /**
     * 온보딩·권한·프로필 프레임의 버튼/칩/카드에 실제로 쓰인 블루.
     * Styleguide "Main 01" 스와치 사각형의 실측 fill 값도 이 값인데,
     * 같은 프레임의 라벨 텍스트와 Toggle 컴포넌트는 #2962FF를 씁니다.
     * 어느 쪽이 정본인지 디자이너 확인이 필요합니다.
     */
    mainAlt: '#383CFF',
    sub1: '#6200EA',   // Sub 01 (서브 보라)
    sub2: '#FFD000',   // Sub 02 (서브 노랑 - Figma Variable #FFD000)
    DEFAULT: '#2962FF',
  },

  // Primary System (피그마 메인 블루 스케일)
  primary: {
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#2962FF', // Main 01 Brand Color
    600: '#1E88E5',
    700: '#1565C0',
    800: '#0D47A1',
    900: '#002171',
    DEFAULT: '#2962FF',
  },

  // Secondary System (서브 포인트)
  secondary: {
    purple: '#6200EA', // Sub 01
    yellow: '#FFD000', // Sub 02
    green: '#00C853',
    DEFAULT: '#6200EA',
  },

  // Text Colors (Text 01 ~ Text 05)
  text: {
    primary: '#111111',   // Text 01 (Main Text Color)
    inverse: '#FFFFFF',   // Text 02 (Inverse Main Text)
    secondary: '#505050', // Text 03 (Sub Text Color 1)
    tertiary: '#767676',  // Text 04 (Sub Text Color 2)
    disabled: '#999999',  // Text 05 (Disabled Text)
    brand: '#2962FF',
  },

  // Icon Colors (Icon 01 ~ Icon 05)
  icon: {
    primary: '#2A2A37',   // Icon 01 (Main Icon Color)
    secondary: '#545461', // Icon 02 (Sub Icon Color 1)
    tertiary: '#81818D',  // Icon 03 (Sub Icon Color 2)
    disabled: '#A5A5AF',  // Icon 04 (Disabled Icon Color)
    inverse: '#FFFFFF',   // Icon 05
  },

  // Background Colors (Light_Color, Regular_Color)
  background: {
    primary: '#FFFFFF',
    light: '#F7F7FB',     // Light_Color BG
    regular: '#F1F1F5',   // Regular_Color BG
    dark: '#2A2A37',      // Dark Mode BG
  },

  // Border & Line Colors (Line Light, Line Regular)
  border: {
    light: '#F1F1F5',     // Line Light_Color
    regular: '#E5E5EC',   // Line Regular_Color (버튼, 인풋, 셀렉트박스 표준 라인)
    black: '#111111',     // Black Line
    strong: '#81818D',
    focus: '#2962FF',
  },

  // Semantic Feedback Colors (상태 컬러)
  semantic: {
    success: {
      light: '#E8F5E9',
      DEFAULT: '#00C853', // Success Green
      dark: '#2E7D32',
    },
    warning: {
      light: '#FFFDE7',
      DEFAULT: '#FBC02D', // Warning Yellow
      dark: '#F57F17',
    },
    danger: {
      light: '#FFEBEE',
      DEFAULT: '#D32F2F', // Error Danger Red
      dark: '#C62828',
    },
    info: {
      light: '#E3F2FD',
      DEFAULT: '#2962FF',
      dark: '#1565C0',
    },
  },

  // Neutral Color Palette
  neutral: {
    0: '#FFFFFF',
    50: '#F7F7FB',
    100: '#F1F1F5',
    200: '#E5E5EC',
    300: '#D9D9D9',
    400: '#A5A5AF',
    500: '#81818D',
    600: '#767676',
    700: '#505050',
    800: '#2A2A37',
    900: '#111111',
    DEFAULT: '#111111',
  },

  social: {
    kakao: '#FFE812',
    kakaoForeground: '#3E1918',
    naver: '#01C73C',
    google: '#FFFFFF',
    pressedOpacity: 0.86,
  },
} as const;

export type ColorTokens = typeof colors;
