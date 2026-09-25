import { CLOSE_ZOOM_THRESHOLD, FAR_ZOOM_UPPER_BOUND } from '@/screens/home/zoomTiers';

import type {
  MobilityType,
  ObstacleIssueType,
  ObstacleReportCluster,
  ObstacleReportClusterBbox,
  ObstacleSeverity,
} from './obstacleReportApi';

/**
 * 개발용 더미 클러스터. 백엔드에 제보 데이터가 없어도 중간/가까운 줌 화면을 에뮬레이터에서
 * 확인할 수 있게, 서울시청 주변 고정 제보를 뷰포트(bbox)와 줌에 맞게 클러스터링해 돌려준다.
 * `EXPO_PUBLIC_DEV_DUMMY_CLUSTERS=true`이고 __DEV__일 때만 useObstacleReportApi가 사용한다.
 *
 * 줌 구간(zoomTiers.ts 값)별 동작은 백엔드와 같은 규칙을 흉내 낸다.
 * - close(>=16): 클러스터링 없음 — 제보 1건 = 클러스터 1개 (id, photoUrls 채움)
 * - mid(12~15): 격자 클러스터링, nearbyPlaceLabel 채움
 * - far(<12): 더 성긴 격자 클러스터링
 */
type DummyReport = {
  readonly id: number;
  readonly lat: number;
  readonly lng: number;
  readonly issueType: ObstacleIssueType;
  readonly severity: ObstacleSeverity;
  readonly minutesAgo: number;
  readonly place: string;
  readonly mobility: readonly MobilityType[];
  readonly stale?: boolean;
  /** undefined면 picsum 이미지. null/빈 문자열/깨진 URL은 썸네일 placeholder 확인용. */
  readonly photo?: string | null;
};

const BROKEN_PHOTO = 'https://invalid.example.invalid/broken.jpg';
const photoOf = (id: number) => `https://picsum.photos/seed/goto-${String(id)}/200/200`;

// 시청 광장(37.5665, 126.978) 주변 약 1km 안에 세 무리로 흩어 둔다 — 무리 안 제보는 서로 수십~수백 m라
// 가까운 줌에서 여러 개가 한 화면에 보이고, 줌을 줄이면 무리별로 묶인다.
const DUMMY_REPORTS: readonly DummyReport[] = [
  // 무리 A: 시청 광장
  { id: 9001, lat: 37.5665, lng: 126.978, issueType: 'HIGH_CURB', severity: 'CAUTION', minutesAgo: 3, place: '서울시청 앞', mobility: ['WHEELCHAIR'] },
  { id: 9002, lat: 37.5671, lng: 126.9787, issueType: 'STAIRS', severity: 'IMPASSABLE', minutesAgo: 25, place: '서울광장 북측', mobility: ['WHEELCHAIR', 'STROLLER'], photo: null },
  { id: 9003, lat: 37.5659, lng: 126.9772, issueType: 'SIDEWALK_DAMAGE', severity: 'CAUTION', minutesAgo: 90, place: '덕수궁 돌담길 입구', mobility: ['WHEELCHAIR'], photo: '' },
  { id: 9004, lat: 37.5662, lng: 126.9795, issueType: 'NARROW_PASSAGE', severity: 'INFO', minutesAgo: 60 * 5, place: '을지로입구역 2번 출구', mobility: ['STROLLER'] },
  { id: 9005, lat: 37.5678, lng: 126.9774, issueType: 'HIGH_CURB', severity: 'CAUTION', minutesAgo: 60 * 26, place: '프레스센터 앞', mobility: ['WHEELCHAIR'] },
  { id: 9006, lat: 37.5668, lng: 126.9768, issueType: 'CONSTRUCTION', severity: 'IMPASSABLE', minutesAgo: 60 * 30, place: '세종대로 공사 구간', mobility: ['WHEELCHAIR', 'SLOW_WALKER'], photo: BROKEN_PHOTO },
  // 무리 B: 광화문 방면
  { id: 9007, lat: 37.5759, lng: 126.9769, issueType: 'STEEP_SLOPE', severity: 'IMPASSABLE', minutesAgo: 12, place: '광화문 광장', mobility: ['WHEELCHAIR'] },
  { id: 9008, lat: 37.5765, lng: 126.9777, issueType: 'LONG_WALKING_DISTANCE', severity: 'INFO', minutesAgo: 200, place: '세종문화회관 앞', mobility: ['SLOW_WALKER'] },
  { id: 9009, lat: 37.5754, lng: 126.9761, issueType: 'STAIRS', severity: 'CAUTION', minutesAgo: 60 * 48, place: '광화문역 6번 출구', mobility: ['WHEELCHAIR', 'STROLLER'], stale: true },
  { id: 9010, lat: 37.5771, lng: 126.9766, issueType: 'SIDEWALK_DAMAGE', severity: 'CAUTION', minutesAgo: 45, place: '경복궁 남쪽 보도', mobility: ['STROLLER'] },
  // 무리 C: 종로/청계천 방면
  { id: 9011, lat: 37.5704, lng: 126.9922, issueType: 'HIGH_CURB', severity: 'INFO', minutesAgo: 8, place: '종로3가역 인근', mobility: ['WHEELCHAIR'] },
  { id: 9012, lat: 37.5698, lng: 126.9931, issueType: 'NARROW_PASSAGE', severity: 'CAUTION', minutesAgo: 75, place: '익선동 골목', mobility: ['WHEELCHAIR', 'STROLLER'] },
  { id: 9013, lat: 37.5711, lng: 126.9914, issueType: 'CONSTRUCTION', severity: 'CAUTION', minutesAgo: 60 * 7, place: '청계천 진입로', mobility: ['SLOW_WALKER'] },
  { id: 9014, lat: 37.5707, lng: 126.9938, issueType: 'STEEP_SLOPE', severity: 'IMPASSABLE', minutesAgo: 60 * 72, place: '종묘 진입 경사로', mobility: ['WHEELCHAIR'] },
];

const SEVERITY_RANK: Record<ObstacleSeverity, number> = { IMPASSABLE: 3, CAUTION: 2, INFO: 1 };

function inBbox(report: DummyReport, bbox: ObstacleReportClusterBbox): boolean {
  return report.lat >= bbox.minLat && report.lat <= bbox.maxLat && report.lng >= bbox.minLng && report.lng <= bbox.maxLng;
}

function toCluster(members: readonly DummyReport[], withPlaceLabel: boolean): ObstacleReportCluster {
  const count = members.length;
  const issueCounts = new Map<ObstacleIssueType, number>();
  for (const member of members) {
    issueCounts.set(member.issueType, (issueCounts.get(member.issueType) ?? 0) + 1);
  }
  const topIssueTypes = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issueType, issueCount]) => ({ issueType, count: issueCount }));
  const maxSeverity = members.reduce<ObstacleSeverity>(
    (max, member) => (SEVERITY_RANK[member.severity] > SEVERITY_RANK[max] ? member.severity : max),
    'INFO',
  );
  const latestMinutesAgo = Math.min(...members.map((member) => member.minutesAgo));
  const single = count === 1 ? members[0] : undefined;

  return {
    centerLat: members.reduce((sum, member) => sum + member.lat, 0) / count,
    centerLng: members.reduce((sum, member) => sum + member.lng, 0) / count,
    reportCount: count,
    maxSeverity,
    topIssueTypes,
    latestReportAt: new Date(Date.now() - latestMinutesAgo * 60_000).toISOString(),
    affectedMobilityTypes: Array.from(new Set(members.flatMap((member) => member.mobility))),
    confirmedReportCount: count,
    resolvedReportCount: 0,
    staleReportCount: members.filter((member) => member.stale === true).length,
    id: single ? single.id : null,
    photoUrls: single ? (single.photo === null ? null : [single.photo ?? photoOf(single.id)]) : null,
    nearbyPlaceLabel: withPlaceLabel ? (members[0]?.place ?? null) : null,
  };
}

/** 뷰포트 안 더미 제보를 줌에 맞게 묶어 백엔드 클러스터 응답 모양으로 돌려준다. */
export function buildDummyClusters(bbox: ObstacleReportClusterBbox, zoom: number): ObstacleReportCluster[] {
  const visible = DUMMY_REPORTS.filter((report) => inBbox(report, bbox));

  if (zoom >= CLOSE_ZOOM_THRESHOLD) {
    return visible.map((report) => toCluster([report], true));
  }

  // 화면을 가로 N칸 x 세로 N칸으로 나눈 격자에 넣는다. far는 성기게, mid는 촘촘하게.
  const cellsPerScreen = zoom < FAR_ZOOM_UPPER_BOUND ? 3 : 6;
  const cellLat = (bbox.maxLat - bbox.minLat) / cellsPerScreen;
  const cellLng = (bbox.maxLng - bbox.minLng) / cellsPerScreen;
  const cells = new Map<string, DummyReport[]>();
  for (const report of visible) {
    const key = `${String(Math.floor((report.lat - bbox.minLat) / cellLat))}:${String(Math.floor((report.lng - bbox.minLng) / cellLng))}`;
    cells.set(key, [...(cells.get(key) ?? []), report]);
  }

  const withPlaceLabel = zoom >= FAR_ZOOM_UPPER_BOUND;
  return Array.from(cells.values()).map((members) => toCluster(members, withPlaceLabel));
}
