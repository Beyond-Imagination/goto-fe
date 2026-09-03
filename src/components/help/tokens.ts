/** 도움 요청 화면에서만 쓰는 값들. 피그마 「도움 01~04 · 도우미 01~02」 실측값입니다. */
export const HELP_SCREEN_X = 20;

/** 요청 흐름은 위치 → 내용 → 전송 3단계입니다. */
export const HELP_REQUEST_TOTAL_STEPS = 3;

export const helpChipPalette = {
  /** 도움 유형 칩. 선택 시 채우고, 미선택은 반투명 테두리 + 연한 파랑 글자. */
  selectedBackground: '#383CFF',
  unselectedBorder: 'rgba(56, 60, 255, 0.5)',
  unselectedText: '#7E81FF',
} as const;

export const helpDurationPalette = {
  selectedBorder: '#2962FF',
  selectedText: '#2962FF',
  unselectedBorder: '#E5E5EC',
} as const;

/** 남은 시간 태그 — 여유(amber) / 촉박(red)을 색과 문구로 함께 구분합니다. */
export const helpTagPalette = {
  urgent: '#D32F2F',
  soon: '#F9A825',
  distance: '#383CFF',
} as const;
