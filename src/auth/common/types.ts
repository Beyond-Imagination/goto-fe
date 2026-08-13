import type { SocialProvider } from '@/components/auth/socialProviders';

import { AUTH_STATUS, OAUTH_LOGIN_STATUS } from './constants';

export type OAuthProvider = Uppercase<SocialProvider>;

export type ProviderCredential = {
  provider: OAuthProvider;
  providerAccessToken: string;
};

/** 메모리에만 두는 플랫폼 세션. refresh token은 SecureStore에 분리한다. */
export type PlatformSession = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
};

export type PendingOAuthSignup = ProviderCredential & {
  suggestedNickname?: string;
  details?: OAuthSignupDetails;
};

export type OAuthSignupDetails = {
  nickname: string;
  agreementMask: number;
};

export type OAuthSignupPreferences = {
  mobilityModes: ('WHEELCHAIR' | 'WALK' | 'STROLLER')[];
  informationPreferences: {
    priorityFacilities: ('ELEVATOR' | 'ACCESSIBLE_TOILET' | 'RAMP' | 'PARKING')[];
    avoidConditions: ('STAIRS' | 'STEEP_SLOPE' | 'UNEVEN_SURFACE')[];
  };
};

export type AuthenticatedOAuthResponse = {
  status: typeof OAUTH_LOGIN_STATUS.authenticated;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type SignupRequiredOAuthResponse = {
  status: typeof OAUTH_LOGIN_STATUS.signupRequired;
  provider: OAuthProvider;
  suggestedNickname?: string;
};

export type OAuthLoginResponse = AuthenticatedOAuthResponse | SignupRequiredOAuthResponse;

export type OAuthLoginOutcome =
  | { type: typeof AUTH_STATUS.authenticated; session: PlatformSession }
  | { type: typeof AUTH_STATUS.signup_required; pendingSignup: PendingOAuthSignup };
