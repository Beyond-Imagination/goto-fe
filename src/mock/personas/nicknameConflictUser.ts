import type { PersonaDefinition } from './types';

export const NICKNAME_CONFLICT_USER: PersonaDefinition = {
  id: 'nickname_conflict_user',
  name: '닉네임 충돌 시뮬레이션 유저',
  description: '회원가입 완료 시 409 NICKNAME_ALREADY_IN_USE 충돌을 시뮬레이션하는 페르소나',
  auth: {
    status: 'unauthenticated',
    session: null,
    pendingSignup: {
      provider: 'KAKAO',
      providerAccessToken: 'dev-mock-conflict-token',
      suggestedNickname: '이미있는닉네임',
    },
  },
  profile: {
    mobility: [],
    facilities: [],
    avoid: [],
    largeText: false,
    highContrast: false,
    vibration: false,
    statusAlerts: false,
  },
};
