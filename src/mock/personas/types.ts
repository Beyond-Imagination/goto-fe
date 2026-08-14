import type { AuthStatus, PendingOAuthSignup, PlatformSession } from '@/auth/common';
import type { AccessibilityProfile } from '@/state/profile';

export interface PersonaAuthData {
  readonly status: AuthStatus;
  readonly session: PlatformSession | null;
  readonly pendingSignup: PendingOAuthSignup | null;
}

export interface PersonaPlacesData {
  readonly recentSearches?: string[];
  readonly bookmarks?: { id: string; name: string; category: string }[];
}

export interface PersonaReportsData {
  readonly myReports?: { id: string; title: string; createdAt: string }[];
}

export interface PersonaDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly auth: PersonaAuthData;
  readonly profile: AccessibilityProfile;
  readonly places?: PersonaPlacesData;
  readonly reports?: PersonaReportsData;
}

export type PersonaKey =
  | 'NEW_SIGNUP_USER'
  | 'WHEELCHAIR_USER'
  | 'STROLLER_USER'
  | 'SENIOR_VISUAL_USER'
  | 'NICKNAME_CONFLICT_USER';
