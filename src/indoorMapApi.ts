import { getApiBaseUrl } from "./authApi";

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
};

export async function fetchIndoorMap(accessToken: string, placeId: number, floor: number): Promise<FloorGeoJson> {
  return getJson<FloorGeoJson>(`/api/v1/places/${placeId}/floors/${floor}/indoor-map`, accessToken);
}

export async function fetchFacilityNodes(
  accessToken: string,
  placeId: number,
  floor: number
): Promise<FacilityNode[]> {
  return getJson<FacilityNode[]>(`/api/v1/places/${placeId}/floors/${floor}/nodes`, accessToken);
}

async function getJson<TResponse>(path: string, accessToken: string): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || response.statusText };
  }

  if (!response.ok) {
    throw new Error(JSON.stringify(payload, null, 2));
  }

  return payload as TResponse;
}
