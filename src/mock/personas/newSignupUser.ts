import type { PersonaDefinition } from './types';

export const NEW_SIGNUP_USER: PersonaDefinition = {
  id: 'new_signup_user',
  name: '신규 가입자 (함께가길)',
  description: '카카오 로그인 완료 후 약관 동의 및 프로필 설정 단계',
  auth: {
    status: 'unauthenticated',
    session: null,
    pendingSignup: {
      provider: 'KAKAO',
      providerAccessToken: 'dev-mock-provider-token',
      suggestedNickname: '함께가길',
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
  places: {
    recentSearches: ['강남역', '서울역'],
    bookmarks: [],
  },
  reports: {
    myReports: [],
  },
};
