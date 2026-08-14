import type { PersonaDefinition } from './types';

export const WHEELCHAIR_USER: PersonaDefinition = {
  id: 'wheelchair_user',
  name: '휠체어 사용자 (김이동)',
  description: '로그인 완료, 휠체어 모드, 엘리베이터/경사로 선호, 계단 회피',
  auth: {
    status: 'authenticated',
    session: {
      accessToken: 'mock-wheelchair-access-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      expiresAt: Date.now() + 86400000,
    },
    pendingSignup: null,
  },
  profile: {
    mobility: ['wheelchair'],
    facilities: ['엘리베이터', '경사로', '장애인 화장실'],
    avoid: ['계단', '급경사', '높은 턱'],
    largeText: false,
    highContrast: true,
    vibration: true,
    statusAlerts: true,
  },
  places: {
    recentSearches: ['코엑스몰', '잠실 롯데월드몰'],
    bookmarks: [
      { id: 'place-1', name: '코엑스몰 동문 경사로', category: '접근로' },
      { id: 'place-2', name: '삼성역 6번 출구 엘리베이터', category: '교통시설' },
    ],
  },
  reports: {
    myReports: [
      { id: 'report-1', title: '강남역 11번 출구 엘리베이터 점검 중', createdAt: '2026-08-10' },
    ],
  },
};
