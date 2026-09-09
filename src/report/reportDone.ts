import type { FacilityReportResponse } from '@/facilityReportApi';
import type { ObstacleReportResponse } from '@/obstacleReportApi';
import type { PlaceStateReportResponse } from '@/placeReportApi';
import type { ReportDoneSummary } from '@/screens/report/ReportDoneScreen';

import {
  FACILITY_ISSUE_TYPE_LABELS,
  ISSUE_TYPE_LABELS,
  PLACE_ACCESS_STATUS_LABELS,
  formatFloorLevel,
} from './reportOptions';

/** 홈 지도(obstacleSeverityStyle)와 같은 심각도 라벨. */
const SEVERITY_LABELS = {
  IMPASSABLE: '우회권장',
  CAUTION: '주의',
  INFO: '안전',
} as const;

/** 심각도에 따라 지도에 어떻게 반영되는지 알려주는 한 줄. */
function toObstacleEffect(severity: ObstacleReportResponse['severity']): string {
  if (severity === 'IMPASSABLE') {
    return '이 구간이 우회 권장 구간으로 반영되었어요';
  }
  if (severity === 'CAUTION') {
    return '이 구간이 주의 구간으로 반영되었어요';
  }
  return '이 구간에 참고 정보로 표시되었어요';
}

/** 제보 07 — 길 위 장애물 완료. */
export function toObstacleDoneSummary(
  report: ObstacleReportResponse,
  placeName: string | null,
): ReportDoneSummary {
  return {
    id: report.id,
    heroTitle: '제보가 등록됐어요',
    heroSubtitle: '여러분의 제보가 길을 만들어요',
    tagLabel: SEVERITY_LABELS[report.severity],
    cards: [
      {
        title: `${ISSUE_TYPE_LABELS[report.issueType] ?? report.issueType} · ${SEVERITY_LABELS[report.severity]}`,
        body: placeName ?? `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`,
        emphasized: true,
      },
      { title: '지도에 바로 반영됐어요', body: toObstacleEffect(report.severity) },
    ],
    photoUrls: report.photoUrls,
    noticeTitle: '다른 사용자가 확인하면 신뢰도가 올라갑니다',
    noticeBody:
      '「아직 있어요」 확인이 쌓이면 더 눈에 띄게 표시되고, 해결되면 지도에서 내려갑니다.',
    primaryActionLabel: '지도에서 보기',
  };
}

/** 제보 08 — 장소 상태 완료. */
export function toPlaceDoneSummary(report: PlaceStateReportResponse): ReportDoneSummary {
  const accessLabel = PLACE_ACCESS_STATUS_LABELS[report.accessStatus];

  return {
    id: report.id,
    heroTitle: '제보가 등록됐어요',
    heroSubtitle: '이 장소를 찾는 다음 사람에게 전달돼요',
    tagLabel: accessLabel,
    cards: [
      {
        title: `${report.placeName} · ${accessLabel}`,
        body: report.placeAddress,
        emphasized: true,
      },
      {
        title: '이 장소의 지도 핀에 반영됐어요',
        body: '공식 무장애 정보를 덮어쓰지 않고 나란히 표시됩니다.',
      },
    ],
    photoUrls: report.photoUrls,
    noticeTitle: '다른 사용자가 확인하면 신뢰도가 올라갑니다',
    noticeBody: '최근 제보일수록 먼저 보이고, 방문 판단에 그대로 쓰입니다.',
    primaryActionLabel: '내 제보 기록 보기',
  };
}

/** 제보 09 — 시설 상태 완료. 체크포인트 시설이면 위치 보정 결과를 함께 알려줍니다. */
export function toFacilityDoneSummary(report: FacilityReportResponse): ReportDoneSummary {
  const issueLabel =
    FACILITY_ISSUE_TYPE_LABELS[report.issueType as keyof typeof FACILITY_ISSUE_TYPE_LABELS] ??
    report.issueType;
  const facilityLabel = report.nodeName ?? report.nodeType;
  const floorLabel = formatFloorLevel(report.floorLevel);
  const isCalibrated = report.calibration !== null;

  return {
    id: report.id,
    heroTitle: isCalibrated ? '정보를 확인해주셔서 고마워요' : '제보가 등록됐어요',
    heroSubtitle: isCalibrated
      ? `현재 위치가 ${floorLabel} ${facilityLabel} 기준으로 보정되었어요`
      : '실내 지도의 시설 정보에 반영돼요',
    tagLabel: issueLabel,
    cards: [
      {
        title: `${facilityLabel} · ${issueLabel}`,
        body: `${report.placeName} · ${floorLabel}`,
        emphasized: true,
      },
      isCalibrated
        ? {
            title: '위치 보정 결과',
            body: `${floorLabel} ${facilityLabel} 지점으로 내 위치를 맞췄어요.`,
          }
        : {
            title: '실내 지도에 반영됐어요',
            body: '이 시설을 지나갈 사람에게 상태가 함께 표시됩니다.',
          },
    ],
    // 시설 제보는 BE에 사진 필드가 없습니다.
    photoUrls: [],
    noticeTitle: '다른 사용자가 확인하면 신뢰도가 올라갑니다',
    noticeBody: '수리가 끝나면 「수리 완료」로 다시 알려주세요. 잘못된 정보가 오래 남지 않습니다.',
    primaryActionLabel: '내 제보 기록 보기',
  };
}
