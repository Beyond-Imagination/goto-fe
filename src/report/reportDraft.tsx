import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { FALLBACK_COORDINATES, type Coordinates } from '@/help';
import type { MobilityType, ObstacleIssueType, ObstacleSeverity } from '@/obstacleReportApi';
import type { FacilityIssueType } from '@/facilityReportApi';
import type { PlaceAccessStatus, PlaceFacilityStatusMap } from '@/placeReportApi';

import type { ReportKind, ReportPhoto } from './reportModel';

export type ReportDraft = {
  readonly kind: ReportKind | null;
  readonly coordinates: Coordinates;
  /** 「현재 위치 주변」에서 장소를 고른 경우. 좌표만 찍었으면 null입니다. */
  readonly placeId: number | null;
  readonly placeName: string | null;
  readonly issueTypes: readonly ObstacleIssueType[];
  readonly affectedMobilityTypes: readonly MobilityType[];
  readonly severity: ObstacleSeverity | null;
  /** 장소 상태 제보(제보 03·04)에서만 씁니다. */
  readonly accessStatus: PlaceAccessStatus | null;
  readonly facilityStatuses: PlaceFacilityStatusMap;
  /** 시설 상태 제보(제보 06)에서만 씁니다. */
  readonly facilityNodeId: number | null;
  readonly facilityNodeLabel: string | null;
  readonly facilityFloorLevel: number | null;
  readonly facilityIssueType: FacilityIssueType | null;
  readonly photos: readonly ReportPhoto[];
  readonly memo: string;
};

const INITIAL_DRAFT: ReportDraft = {
  kind: null,
  coordinates: FALLBACK_COORDINATES,
  placeId: null,
  placeName: null,
  issueTypes: [],
  affectedMobilityTypes: [],
  severity: null,
  accessStatus: null,
  facilityStatuses: {},
  facilityNodeId: null,
  facilityNodeLabel: null,
  facilityFloorLevel: null,
  facilityIssueType: null,
  photos: [],
  memo: '',
};

type ReportDraftContextValue = {
  readonly draft: ReportDraft;
  readonly patchDraft: (patch: Partial<ReportDraft>) => void;
  readonly resetDraft: () => void;
};

const ReportDraftContext = createContext<ReportDraftContextValue | null>(null);

/** 유형 → 위치 → 상세 → 완료가 같은 초안을 공유합니다. */
export function ReportDraftProvider({ children }: { readonly children: ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>(INITIAL_DRAFT);

  // 함수 정체성을 고정해야 조회 훅의 의존성이 매 렌더 바뀌지 않습니다.
  const patchDraft = useCallback(
    (patch: Partial<ReportDraft>) => setDraft(previous => ({ ...previous, ...patch })),
    [],
  );
  const resetDraft = useCallback(() => setDraft(INITIAL_DRAFT), []);

  const value = useMemo<ReportDraftContextValue>(
    () => ({ draft, patchDraft, resetDraft }),
    [draft, patchDraft, resetDraft],
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft(): ReportDraftContextValue {
  const context = useContext(ReportDraftContext);

  if (!context) {
    throw new Error('useReportDraft must be used inside a ReportDraftProvider.');
  }

  return context;
}