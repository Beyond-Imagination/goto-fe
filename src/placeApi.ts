import { getJson } from "./apiClient";
import { MobilityType, ObstacleIssueType } from "./obstacleReportApi";

export type NearbyAccessibilitySummary = {
  detourRecommendedCount: number;
  cautionCount: number;
  safeCount: number;
  needsConfirmationCount: number;
};

export type NearbyAccessibilitySummaryOptions = {
  mobilityTypes?: readonly MobilityType[];
  avoid?: readonly ObstacleIssueType[];
};

export async function fetchNearbyAccessibilitySummary(
  accessToken: string,
  lat: number,
  lng: number,
  options: NearbyAccessibilitySummaryOptions = {}
): Promise<NearbyAccessibilitySummary> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  for (const mobilityType of options.mobilityTypes ?? []) {
    params.append("mobilityTypes", mobilityType);
  }
  for (const issueType of options.avoid ?? []) {
    params.append("avoid", issueType);
  }
  return getJson<NearbyAccessibilitySummary>(`/api/v1/places/nearby-summary?${params.toString()}`, accessToken);
}

export type PlaceSearchItem = {
  placeId: number;
  name: string;
  categoryCode: string;
  address: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  hasIndoorMap: boolean;
};

export type PlaceSearchResult = {
  places: PlaceSearchItem[];
};

export type SearchPlacesOptions = {
  k?: number;
  categoryPrefixes?: readonly string[];
  // 현재 백엔드에서 no-op(ADR-0004) — 요청은 보내지만 실제 필터링은 아직 적용 안 됨.
  mobilityTypes?: readonly MobilityType[];
  avoid?: readonly ObstacleIssueType[];
};

export async function searchPlaces(
  accessToken: string,
  lat: number,
  lng: number,
  options: SearchPlacesOptions = {}
): Promise<PlaceSearchResult> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });

  if (options.k !== undefined) {
    params.set("k", String(options.k));
  }
  for (const prefix of options.categoryPrefixes ?? []) {
    params.append("categoryPrefixes", prefix);
  }
  for (const mobilityType of options.mobilityTypes ?? []) {
    params.append("mobilityTypes", mobilityType);
  }
  for (const issueType of options.avoid ?? []) {
    params.append("avoid", issueType);
  }

  return getJson<PlaceSearchResult>(`/api/v1/places/search?${params.toString()}`, accessToken);
}
