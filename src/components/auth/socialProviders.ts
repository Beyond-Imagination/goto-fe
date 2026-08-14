export const SOCIAL_PROVIDERS = ['kakao', 'naver', 'google'] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  kakao: '카카오로 시작하기',
  naver: '네이버로 시작하기',
  google: '구글로 시작하기',
};

export const SOCIAL_PROVIDER_ACCESSIBILITY_LABELS: Record<SocialProvider, string> = {
  kakao: '카카오로 시작하기',
  naver: '네이버로 시작하기',
  google: '구글로 시작하기',
};

export const loginHeadline = '오늘 갈 수 있는 길을\n함께 확인해요';

export const loginAccessNotice = '제보와 도움 요청은 로그인이 필요해요';
