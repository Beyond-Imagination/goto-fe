import type { ReportListItemData } from '@/components/myinfo/ReportListItem';

/**
 * TODO(BE): 내 정보 관련 API가 아직 없어서 피그마 「내 정보 01~07」 프레임의
 * 목업 데이터를 그대로 옮겨둔 파일입니다. 엔드포인트가 생기면 통째로 대체합니다.
 */

export const MOCK_PROFILE_SUMMARY = {
  nickname: '경주여행자',
  /** 「휠체어 기준 · 동행자」 — 접근성 프로필 요약 문구. */
  profileSummary: '휠체어 기준 · 동행자',
  stats: [
    { value: '12', unit: '건', label: '내제보' },
    { value: '48', unit: '명', label: '도움 된 사람' },
    { value: '3', unit: '건', label: '해결 확인' },
  ],
} as const;

/** 접근성 프로필(02)에서 아직 아무것도 고르지 않았을 때 보여줄 예시 값. */
export const MOCK_ACCESSIBILITY_PROFILE = {
  mobility: ['휠체어', '동행자와 함께'],
  facilities: ['엘리베이터', '장애인 화장실', '경사로'],
  avoid: ['계단', '높은 턱'],
} as const;

/** 내 제보 기록(03) 목록. */
export const MOCK_MY_REPORTS: readonly ReportListItemData[] = [
  {
    id: '1247',
    category: '장애물',
    title: '보도 파손 · 통행 어려움',
    address: '서울시 마포구 월드컵로 23길',
    meta: '2024.05.12 · 제보 ID 1247',
    tags: [
      { label: '확인 5명', tone: 'green' },
      { label: '지도반영', tone: 'green' },
    ],
  },
  {
    id: '1183',
    category: '장소',
    title: '1층 장애인 화장실 · 정상',
    address: '서울시 종로구 세종대로 1길',
    meta: '2024.05.08 · 제보 ID 1183',
    tags: [{ label: '지도반영', tone: 'green' }],
  },
  {
    id: '1092',
    category: '장애물',
    title: '높은 턱 · 우회 권장',
    address: '서울시 서대문구 연희로 11',
    meta: '2024.05.03 · 제보 ID 1092',
    tags: [{ label: '해결됨', tone: 'blue' }],
  },
];

type ConfirmedReport = ReportListItemData & {
  /** 필터 구분용 확인 상태. */
  readonly resolution: '아직 있음' | '해결 됨';
};

/** 내가 확인한 리포트(05) 목록. */
export const MOCK_CONFIRMED_REPORTS: readonly ConfirmedReport[] = [
  {
    id: '1247',
    category: '장애물',
    title: '보도 파손 · 통행 어려움',
    address: '서울시 마포구 월드컵로 23길',
    meta: '2024.05.12 · 제보 ID 1247',
    tags: [{ label: '아직 있음', tone: 'amber' }],
    resolution: '아직 있음',
  },
  {
    id: '1183',
    category: '장소',
    title: '1층 장애인 화장실 · 정상',
    address: '서울시 종로구 세종대로 1길',
    meta: '2024.05.08 · 제보 ID 1183',
    tags: [{ label: '아직 있음', tone: 'amber' }],
    resolution: '아직 있음',
  },
  {
    id: '1092',
    category: '장애물',
    title: '높은 턱 · 우회 권장',
    address: '서울시 서대문구 연희로 11',
    meta: '2024.05.03 · 제보 ID 1092',
    tags: [{ label: '해결됨', tone: 'blue' }],
    resolution: '해결 됨',
  },
];

export const MOCK_CONFIRMED_SUMMARY = '총 7건 · 최근 확인한 시설 7곳';
