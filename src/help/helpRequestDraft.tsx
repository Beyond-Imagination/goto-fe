import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { FALLBACK_COORDINATES, type Coordinates } from './currentLocation';
import type { HelpKind } from './helpKind';

/** 위치 입력 화면의 두 가지 모드. */
export const HELP_LOCATION_MODE = {
  insidePlace: 'insidePlace',
  onRoad: 'onRoad',
} as const;

export type HelpLocationMode = (typeof HELP_LOCATION_MODE)[keyof typeof HELP_LOCATION_MODE];

export type HelpRequestDraft = {
  readonly mode: HelpLocationMode;
  readonly placeId: number | null;
  readonly placeName: string | null;
  readonly coordinates: Coordinates;
  /** 「1층」처럼 사용자가 적은 층. 길 위 요청이면 비어 있습니다. */
  readonly floorText: string;
  readonly locationLabel: string;
  readonly kinds: readonly HelpKind[];
  readonly message: string;
  readonly expiresInMinutes: number;
};

/** 시안의 기본 선택값 — 만료 10분, 유형·장소는 사용자가 고르기 전까지 비어 있습니다. */
const INITIAL_DRAFT: HelpRequestDraft = {
  mode: HELP_LOCATION_MODE.insidePlace,
  placeId: null,
  placeName: null,
  coordinates: FALLBACK_COORDINATES,
  floorText: '',
  locationLabel: '',
  kinds: [],
  message: '',
  expiresInMinutes: 10,
};

type HelpRequestDraftContextValue = {
  readonly draft: HelpRequestDraft;
  readonly patchDraft: (patch: Partial<HelpRequestDraft>) => void;
  readonly resetDraft: () => void;
};

const HelpRequestDraftContext = createContext<HelpRequestDraftContextValue | null>(null);

/** 위치 → 내용 → 대기 3단계가 같은 초안을 공유합니다. */
export function HelpRequestDraftProvider({ children }: { readonly children: ReactNode }) {
  const [draft, setDraft] = useState<HelpRequestDraft>(INITIAL_DRAFT);

  const value = useMemo<HelpRequestDraftContextValue>(
    () => ({
      draft,
      patchDraft: patch => setDraft(previous => ({ ...previous, ...patch })),
      resetDraft: () => setDraft(INITIAL_DRAFT),
    }),
    [draft],
  );

  return <HelpRequestDraftContext.Provider value={value}>{children}</HelpRequestDraftContext.Provider>;
}

export function useHelpRequestDraft(): HelpRequestDraftContextValue {
  const context = useContext(HelpRequestDraftContext);

  if (!context) {
    throw new Error('useHelpRequestDraft must be used inside a HelpRequestDraftProvider.');
  }

  return context;
}

/** 층 입력은 자유 텍스트라 숫자만 뽑아 BE의 floorLevel(Integer)로 넘깁니다. */
export function parseFloorLevel(floorText: string): number | null {
  const matched = /-?\d+/.exec(floorText);
  return matched ? Number.parseInt(matched[0], 10) : null;
}
