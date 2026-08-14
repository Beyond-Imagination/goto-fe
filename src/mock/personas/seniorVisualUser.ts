import type { PersonaDefinition } from './types';

export const SENIOR_VISUAL_USER: PersonaDefinition = {
  id: 'senior_visual_user',
  name: '시각/고령 약자 (박어르신)',
  description: '로그인 완료, 큰 글씨, 고대비, 진동 및 음성 상태 알림 활성화',
  auth: {
    status: 'authenticated',
    session: {
      accessToken: 'mock-senior-access-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      expiresAt: Date.now() + 86400000,
    },
    pendingSignup: null,
  },
  profile: {
    mobility: [],
    facilities: ['엘리베이터'],
    avoid: ['계단', '공사구간'],
    largeText: true,
    highContrast: true,
    vibration: true,
    statusAlerts: true,
  },
  places: {
    recentSearches: ['종로노인종합복지관', '서울대병원'],
    bookmarks: [],
  },
  reports: {
    myReports: [],
  },
};
