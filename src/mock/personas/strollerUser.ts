import type { PersonaDefinition } from './types';

export const STROLLER_USER: PersonaDefinition = {
  id: 'stroller_user',
  name: '유모차 동반자 (이든든)',
  description: '로그인 완료, 유모차 모드, 수유실/엘리베이터 선호, 계단/좁은통로 회피',
  auth: {
    status: 'authenticated',
    session: {
      accessToken: 'mock-stroller-access-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      expiresAt: Date.now() + 86400000,
    },
    pendingSignup: null,
  },
  profile: {
    mobility: ['stroller'],
    facilities: ['엘리베이터', '수유실', '경사로'],
    avoid: ['계단', '좁은통로', '보도 파손'],
    largeText: false,
    highContrast: false,
    vibration: false,
    statusAlerts: true,
  },
  places: {
    recentSearches: ['현대백화점 판교점', '스타필드 하남'],
    bookmarks: [
      { id: 'place-3', name: '스타필드 하남 유아휴게실', category: '편의시설' },
    ],
  },
  reports: {
    myReports: [],
  },
};
