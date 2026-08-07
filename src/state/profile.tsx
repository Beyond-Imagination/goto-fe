import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ImageSourcePropType } from 'react-native';

export type MobilityId =
  | 'wheelchair'
  | 'stroller'
  | 'cane'
  | 'walker'
  | 'slowWalk'
  | 'other';

export type MobilityOption = {
  id: MobilityId;
  label: string;
  icon: ImageSourcePropType;
};

export const MOBILITY_OPTIONS: MobilityOption[] = [
  { id: 'wheelchair', label: '휠체어', icon: require('../assets/mobility-wheelchair.png') },
  { id: 'stroller', label: '유모차', icon: require('../assets/mobility-stroller.png') },
  { id: 'cane', label: '지팡이', icon: require('../assets/mobility-cane.png') },
  { id: 'walker', label: '보행 보조기구', icon: require('../assets/mobility-walker.png') },
  { id: 'slowWalk', label: '느린 보행', icon: require('../assets/mobility-slow-walk.png') },
  { id: 'other', label: '기타', icon: require('../assets/mobility-other.png') }
];

export const PRIORITY_FACILITIES = [
  '엘리베이터',
  '장애인 화장실',
  '경사로',
  '주차장',
  '수유실',
  '점자블록',
  '음성안내'
] as const;

export const AVOID_CONDITIONS = [
  '계단',
  '높은 턱',
  '급경사',
  '좁은통로',
  '공사 구간',
  '보도 파손',
  '긴 보행 거리'
] as const;

/** 화면기획 7.2 — 우선 확인 시설 / 피하고 싶은 조건은 각각 최대 3개까지 선택합니다. */
export const MAX_SELECTION = 3;

export type AccessibilityProfile = {
  mobility: MobilityId[];
  facilities: string[];
  avoid: string[];
  largeText: boolean;
  highContrast: boolean;
  vibration: boolean;
  statusAlerts: boolean;
};

type ProfileContextValue = {
  profile: AccessibilityProfile;
  toggleMobility: (id: MobilityId) => void;
  toggleFacility: (label: string) => void;
  toggleAvoid: (label: string) => void;
  setDisplayOption: (
    key: 'largeText' | 'highContrast' | 'vibration' | 'statusAlerts',
    value: boolean
  ) => void;
};

/** 사용자가 직접 고르기 전까지는 아무것도 켜지 않은 상태로 시작합니다. */
const INITIAL_PROFILE: AccessibilityProfile = {
  mobility: [],
  facilities: [],
  avoid: [],
  largeText: false,
  highContrast: false,
  vibration: false,
  statusAlerts: false
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function toggleWithLimit<T>(list: T[], value: T, limit?: number): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }

  if (limit !== undefined && list.length >= limit) {
    return list;
  }

  return [...list, value];
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AccessibilityProfile>(INITIAL_PROFILE);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      toggleMobility: (id) =>
        setProfile((prev) => ({ ...prev, mobility: toggleWithLimit(prev.mobility, id) })),
      toggleFacility: (label) =>
        setProfile((prev) => ({
          ...prev,
          facilities: toggleWithLimit(prev.facilities, label, MAX_SELECTION)
        })),
      toggleAvoid: (label) =>
        setProfile((prev) => ({
          ...prev,
          avoid: toggleWithLimit(prev.avoid, label, MAX_SELECTION)
        })),
      setDisplayOption: (key, next) => setProfile((prev) => ({ ...prev, [key]: next }))
    }),
    [profile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used inside a ProfileProvider.');
  }

  return context;
}
