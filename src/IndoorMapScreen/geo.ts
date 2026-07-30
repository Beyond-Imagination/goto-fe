import type { Coord, NaverMapViewRef } from "@mj-studio/react-native-naver-map";

import type { FacilityNode, FloorGeoJson, GeoJsonFeature } from "../indoorMapApi";
import type { Shape } from "./types";

export const DEFAULT_CENTER: Coord = { latitude: 37.5796, longitude: 126.977 };
// 네이버 지도 SDK의 사실상 최대 줌 레벨. 실내 도면 진입/노드 선택 시 이 값으로 통일해서
// 노드를 선택했을 때 도면이 오히려 축소되어 보이는 일이 없도록 한다.
export const INDOOR_MAX_ZOOM = 21;

// 폴리곤 category별 스타일. 실제 역사 도면 관례(유료/무료 구역, 개찰구)를 참고하되
// 채도를 낮춰 그레이톤으로 통일함 (구역 구분은 색보다 옅은 명암 차이로만 표현).
export const SHAPE_STYLES: Record<string, { fill: string; outline: string }> = {
  room: { fill: "#fafaf9", outline: "#d7dbd8" },
  corridor: { fill: "#ffffff", outline: "#e2e5e3" },
  unpaid_zone: { fill: "#eef1ee", outline: "#c3ccc5" },
  paid_zone: { fill: "#eef0f3", outline: "#c1c9d1" },
  gate: { fill: "#faf3e3", outline: "#e0a825" }
};
export const DEFAULT_SHAPE_STYLE = SHAPE_STYLES.room;

// 🛗, 🚻 이모지는 자체 불투명 배경이 있어 체크포인트 색상(주황/초록)을 가려버리므로 텍스트로 대체.
export const FACILITY_EMOJI: Record<string, string> = {
  ELEVATOR: "EL",
  STAIRS: "🪜",
  RESTROOM: "WC",
  INFO_DESK: "📋",
  TICKET_MACHINE: "TM",
  WIDE_GATE: "GT",
  STAFF_ROOM: "SR",
  PANTRY: "PT"
};

export const FACILITY_LABEL: Record<string, string> = {
  ELEVATOR: "엘리베이터",
  STAIRS: "계단",
  RESTROOM: "화장실",
  INFO_DESK: "안내데스크",
  TICKET_MACHINE: "발권기",
  WIDE_GATE: "게이트",
  STAFF_ROOM: "직원실",
  PANTRY: "탕비실"
};

export function facilityLabel(node: FacilityNode): string {
  return node.name ?? FACILITY_LABEL[node.nodeType] ?? node.nodeType;
}

export function formatFloorLabel(floor: number): string {
  return floor > 0 ? `${floor}F` : `B${-floor}`;
}

export function formatFloorKorean(floor: number): string {
  return floor > 0 ? `${floor}층` : `지하${-floor}층`;
}

// 백엔드 GeoJSON은 Polygon/MultiPolygon을 느슨한 타입(unknown)으로 내려주므로 좌표를 직접 파싱한다.
// 형식이 어긋난 feature는 화면 전체를 깨뜨리지 않도록 경고만 남기고 건너뛴다.
// TODO: 실제 도면 데이터로 렌더링 검증 시 exterior ring의 winding 방향(Naver는 시계 방향 요구)을 확인할 것.
export function extractShapes(geojson: FloorGeoJson): Shape[] {
  if (!geojson || !Array.isArray(geojson.features)) {
    console.warn("extractShapes: invalid FloorGeoJson", geojson);
    return [];
  }

  const shapes: Shape[] = [];

  geojson.features.forEach((feature, featureIndex) => {
    if (!feature || typeof feature !== "object") {
      console.warn("extractShapes: skipping invalid feature at index", featureIndex, feature);
      return;
    }

    const properties = feature.properties ?? {};
    const id = typeof properties.node_id === "string" ? properties.node_id : `shape-${featureIndex}`;
    const label = typeof properties.label === "string" ? properties.label : undefined;
    // category가 없는 기존 데이터와의 호환을 위해 id === "corridor"면 복도로 간주한다.
    const category = typeof properties.category === "string" ? properties.category : id === "corridor" ? "corridor" : "room";

    extractRings(feature).forEach((coords, ringIndex) => {
      shapes.push({
        id: ringIndex === 0 ? id : `${id}-${ringIndex}`,
        label: ringIndex === 0 ? label : undefined,
        category,
        coords
      });
    });
  });

  return shapes;
}

function extractRings(feature: GeoJsonFeature): Coord[][] {
  const { geometry } = feature;

  if (!geometry || typeof geometry !== "object") {
    console.warn("extractRings: feature has no geometry", feature);
    return [];
  }

  if (geometry.type === "Polygon") {
    return toRings(geometry.coordinates as number[][][]);
  }

  if (geometry.type === "MultiPolygon") {
    if (!Array.isArray(geometry.coordinates)) {
      console.warn("extractRings: MultiPolygon coordinates is not an array", geometry.coordinates);
      return [];
    }
    return (geometry.coordinates as number[][][][]).flatMap(toRings);
  }

  return [];
}

function toRings(rings: number[][][]): Coord[][] {
  if (!Array.isArray(rings)) {
    console.warn("toRings: rings is not an array", rings);
    return [];
  }

  const [exteriorRing] = rings;
  if (!Array.isArray(exteriorRing) || exteriorRing.length === 0) {
    return [];
  }

  const coords = exteriorRing
    .filter(
      (point): point is number[] =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    )
    .map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

  if (coords.length !== exteriorRing.length) {
    console.warn("toRings: skipped invalid coordinates in ring", exteriorRing);
  }

  return coords.length > 0 ? [coords] : [];
}

export function centroidOfRing(ring: Coord[]): Coord | null {
  if (ring.length === 0) {
    return null;
  }

  // GeoJSON 폴리곤 링은 첫 좌표와 끝 좌표가 같으므로 중복을 제외하고 평균을 낸다.
  const points = ring.length > 1 ? ring.slice(0, -1) : ring;
  const sum = points.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude,
      longitude: acc.longitude + point.longitude
    }),
    { latitude: 0, longitude: 0 }
  );

  return { latitude: sum.latitude / points.length, longitude: sum.longitude / points.length };
}

export function centerOfNodes(nodes: FacilityNode[]): Coord | null {
  if (!Array.isArray(nodes)) {
    console.warn("centerOfNodes: nodes is not an array", nodes);
    return null;
  }

  const first = nodes.find((node) => Number.isFinite(node?.lat) && Number.isFinite(node?.lng));
  return first ? { latitude: first.lat, longitude: first.lng } : null;
}

// 도면(방+시설 노드) 중심으로 최대 줌까지 당겨서 보여준다.
// 도면의 실제 위경도 bbox 가로세로 비율이 폰 화면(세로로 긴) 비율과 다르면
// 한쪽 방향은 꽉 차고 반대쪽엔 여백이 남을 수 있다 — 실제 도면 형태(예: 좌우로
// 긴 승강장형 레이아웃)에 따른 자연스러운 한계이며 카메라 값으로 해소되지 않는다.
export function fitCameraToBounds(map: NaverMapViewRef | null, shapes: Shape[], nodes: FacilityNode[]) {
  const coords: Coord[] = [
    ...shapes.flatMap((shape) => shape.coords),
    ...nodes.map((node) => ({ latitude: node.lat, longitude: node.lng }))
  ];

  if (!map || coords.length === 0) {
    return;
  }

  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const center = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2
  };

  map.animateCameraTo({ ...center, zoom: INDOOR_MAX_ZOOM, duration: 300 });
}
