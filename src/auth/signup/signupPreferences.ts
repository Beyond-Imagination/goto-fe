import type { AccessibilityProfile } from '@/state/profile';

import type { OAuthSignupPreferences } from '@/auth/common';

const FACILITY_MAP = {
  '엘리베이터': 'ELEVATOR',
  '장애인 화장실': 'ACCESSIBLE_TOILET',
  '경사로': 'RAMP',
  '주차장': 'PARKING',
} as const;

const AVOID_MAP = {
  '계단': 'STAIRS',
  '급경사': 'STEEP_SLOPE',
  '보도 파손': 'UNEVEN_SURFACE',
} as const;

export function toOAuthSignupPreferences(profile: AccessibilityProfile): OAuthSignupPreferences {
  return {
    mobilityModes: unique([
      ...(profile.mobility.includes('wheelchair') ? ['WHEELCHAIR' as const] : []),
      ...(profile.mobility.includes('stroller') ? ['STROLLER' as const] : []),
    ]),
    informationPreferences: {
      priorityFacilities: unique(
        profile.facilities.flatMap((facility) => {
          const value = FACILITY_MAP[facility as keyof typeof FACILITY_MAP];
          return value ? [value] : [];
        }),
      ),
      avoidConditions: unique(
        profile.avoid.flatMap((condition) => {
          const value = AVOID_MAP[condition as keyof typeof AVOID_MAP];
          return value ? [value] : [];
        }),
      ),
    },
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
