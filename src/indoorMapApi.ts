import { request } from "./apiClient";

export type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

export type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown> | null;
};

export type FloorGeoJson = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type FacilityNode = {
  id: number;
  floorMapId: number;
  targetFeatureId: string | null;
  nodeType: string;
  name: string | null;
  lat: number;
  lng: number;
  isCheckpoint: boolean;
  snapRadius: number | null;
  locationDescription: string | null;
};

export async function fetchFloors(accessToken: string, placeId: number): Promise<number[]> {
  return request<number[]>(`/api/v1/places/${placeId}/floors`, { accessToken });
}

export async function fetchIndoorMap(accessToken: string, placeId: number, floor: number): Promise<FloorGeoJson> {
  return request<FloorGeoJson>(`/api/v1/places/${placeId}/floors/${floor}/indoor-map`, { accessToken });
}

export async function fetchFacilityNodes(
  accessToken: string,
  placeId: number,
  floor: number
): Promise<FacilityNode[]> {
  return request<FacilityNode[]>(`/api/v1/places/${placeId}/floors/${floor}/nodes`, { accessToken });
}
