export const NICKNAME_FIXTURES = {
  /**
   * Mock 환경에서 중복(사용 불가)으로 판정되는 닉네임 목록
   */
  unavailable: ['이미있는닉네임', '중복닉네임'] as const,
  /**
   * 닉네임 충돌 유저(NICKNAME_CONFLICT_USER) 페르소나의 추천 닉네임
   */
  conflict: '이미있는닉네임',
  /**
   * 신규 가입자(NEW_SIGNUP_USER) 페르소나의 기본 추천 닉네임
   */
  suggested: '함께가길',
  /**
   * 테스트 및 개발 시 사용할 수 있는 정상 닉네임 예시
   */
  available: '새로운닉네임',
} as const;

export type NicknameFixtures = typeof NICKNAME_FIXTURES;
