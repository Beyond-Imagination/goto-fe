import assert from 'node:assert/strict';
import test from 'node:test';

import { toOAuthSignupPreferences } from '@/auth/signup/signupPreferences';
import type { AccessibilityProfile } from '@/state/profile';

function profile(overrides: Partial<AccessibilityProfile>): AccessibilityProfile {
  return {
    mobility: [],
    facilities: [],
    avoid: [],
    largeText: false,
    highContrast: false,
    vibration: false,
    statusAlerts: false,
    ...overrides,
  };
}

test('가입 payload에는 백엔드가 지원하는 프로필 값만 남는다', () => {
  // Given: 지원 값과 미지원 값이 섞인 접근성 프로필이 있다.
  const selectedProfile = profile({
    mobility: ['wheelchair', 'stroller', 'cane', 'slowWalk'],
    facilities: ['엘리베이터', '수유실', '경사로', '음성안내'],
    avoid: ['계단', '높은 턱', '보도 파손', '긴 보행 거리'],
  });

  // When: 백엔드 선호 설정으로 변환한다.
  const preferences = toOAuthSignupPreferences(selectedProfile);

  // Then: 휠체어, 유모차, 엘리베이터, 경사로, 계단, 보도 파손만 남는다.
  assert.deepEqual(preferences, {
    mobilityModes: ['WHEELCHAIR', 'STROLLER'],
    informationPreferences: {
      priorityFacilities: ['ELEVATOR', 'RAMP'],
      avoidConditions: ['STAIRS', 'UNEVEN_SURFACE'],
    },
  });
});
