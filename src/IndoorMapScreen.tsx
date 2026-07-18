import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { NaverMapMarkerOverlay, NaverMapPolygonOverlay, NaverMapView, type Coord } from "@mj-studio/react-native-naver-map";

import {
  FacilityNode,
  FloorGeoJson,
  GeoJsonFeature,
  fetchFacilityNodes,
  fetchFloors,
  fetchIndoorMap
} from "./indoorMapApi";

const DEFAULT_CENTER: Coord = { latitude: 37.5796, longitude: 126.977 };

// 폴리곤 category별 스타일. 실제 역사 도면 관례(유료/무료 구역, 개찰구)를 참고함.
const SHAPE_STYLES: Record<string, { fill: string; outline: string }> = {
  room: { fill: "rgba(147, 197, 253, 0.45)", outline: "#3b82f6" },
  corridor: { fill: "rgba(226, 232, 240, 0.6)", outline: "#94a3b8" },
  unpaid_zone: { fill: "rgba(187, 247, 208, 0.55)", outline: "#16a34a" },
  paid_zone: { fill: "rgba(191, 219, 254, 0.55)", outline: "#2563eb" },
  gate: { fill: "rgba(253, 230, 138, 0.6)", outline: "#d97706" }
};
const DEFAULT_SHAPE_STYLE = SHAPE_STYLES.room;

// 🛗, 🚻 이모지는 자체 불투명 배경이 있어 체크포인트 색상(주황/초록)을 가려버리므로 텍스트로 대체.
const FACILITY_EMOJI: Record<string, string> = {
  ELEVATOR: "EL",
  STAIRS: "🪜",
  RESTROOM: "WC",
  INFO_DESK: "📋",
  TICKET_MACHINE: "TM",
  WIDE_GATE: "GT",
  STAFF_ROOM: "SR",
  PANTRY: "PT"
};

type IndoorMapScreenProps = {
  accessToken: string;
  placeId: number;
  placeName?: string;
};

type MapData = { shapes: Shape[]; nodes: FacilityNode[] };
type Camera = Coord & { zoom: number };
type ScreenMode = "outdoor" | "indoor";

export function IndoorMapScreen({ accessToken, placeId, placeName }: IndoorMapScreenProps) {
  const [floors, setFloors] = useState<number[] | null>(null);
  const [floorsError, setFloorsError] = useState<string | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  // mapData는 새 층 데이터가 성공적으로 도착했을 때만 교체한다 — 로딩 중에 null로
  // 비워버리면 오버레이 전체가 unmount/remount 되면서 네이티브 쪽에서 폴리곤 레이어가
  // 깨지는 문제가 있었음. 이전 층 도면을 유지한 채 로딩 스피너만 위에 띄운다.
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [indoorCamera, setIndoorCamera] = useState<Camera>({ ...DEFAULT_CENTER, zoom: 19 });
  // 장소의 대표 위치. 최초 도면 로딩 성공 시 한 번만 설정하고 이후 층을 옮겨도 유지한다
  // (야외 지도에서 보여줄 마커 위치가 현재 보고 있던 층에 따라 흔들리지 않도록).
  const [placeCenter, setPlaceCenter] = useState<Coord | null>(null);
  const [mode, setMode] = useState<ScreenMode>("outdoor");

  useEffect(() => {
    let cancelled = false;

    async function loadFloors() {
      try {
        const result = await fetchFloors(accessToken, placeId);
        if (!cancelled) {
          setFloors(result);
          setFloor(result[0] ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setFloorsError(error instanceof Error ? error.message : String(error));
        }
      }
    }

    loadFloors();

    return () => {
      cancelled = true;
    };
  }, [accessToken, placeId]);

  useEffect(() => {
    if (floor === null) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoadingMap(true);
      setMapError(null);
      try {
        const [geojson, nodes] = await Promise.all([
          fetchIndoorMap(accessToken, placeId, floor as number),
          fetchFacilityNodes(accessToken, placeId, floor as number)
        ]);
        if (!cancelled) {
          const shapes = extractShapes(geojson);
          const center = centroidOfRing(shapes[0]?.coords ?? []) ?? centerOfNodes(nodes) ?? DEFAULT_CENTER;
          setIndoorCamera({ ...center, zoom: 19 });
          setPlaceCenter((prev) => prev ?? center);
          setMapData({ shapes, nodes });
        }
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMap(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, placeId, floor]);

  if (floorsError) {
    return (
      <View style={styles.center}>
        <Text selectable style={styles.errorText}>
          {floorsError}
        </Text>
      </View>
    );
  }

  if (floors === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (floors.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>등록된 층이 없습니다.</Text>
      </View>
    );
  }

  const camera = mode === "indoor" ? indoorCamera : { ...(placeCenter ?? DEFAULT_CENTER), zoom: 16 };

  return (
    <View style={styles.container}>
      <NaverMapView style={styles.map} camera={camera}>
        {mode === "outdoor" && placeCenter && (
          <NaverMapMarkerOverlay
            latitude={placeCenter.latitude}
            longitude={placeCenter.longitude}
            width={40}
            height={40}
            anchor={{ x: 0.5, y: 0.5 }}
            caption={{
              text: `${placeName ?? "장소"} (실내지도 보기)`,
              textSize: 13,
              color: "#111827",
              haloColor: "#ffffff",
              offset: 4
            }}
            onTap={() => setMode("indoor")}
          >
            <View key="place-marker" collapsable={false} style={styles.placeMarker}>
              <Text style={styles.placeMarkerEmoji}>🏢</Text>
            </View>
          </NaverMapMarkerOverlay>
        )}

        {mode === "indoor" && mapData && <IndoorMapOverlays shapes={mapData.shapes} nodes={mapData.nodes} />}
      </NaverMapView>

      {mode === "outdoor" && isLoadingMap && !placeCenter && (
        <View style={styles.overlayCenter}>
          <ActivityIndicator />
        </View>
      )}

      {mode === "indoor" && (
        <>
          {isLoadingMap && (
            <View style={styles.overlayCenter}>
              <ActivityIndicator />
            </View>
          )}

          {mapError && !isLoadingMap && (
            <View style={styles.overlayCenter}>
              <Text selectable style={styles.errorText}>
                {mapError}
              </Text>
            </View>
          )}

          <Pressable style={styles.backButton} onPress={() => setMode("outdoor")}>
            <Text style={styles.backButtonText}>← 전면 지도로 돌아가기</Text>
          </Pressable>

          <View style={styles.floorSelector}>
            {floors.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFloor(f)}
                style={[styles.floorButton, f === floor && styles.floorButtonActive]}
              >
                <Text style={[styles.floorButtonText, f === floor && styles.floorButtonTextActive]}>
                  {formatFloorLabel(f)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

type IndoorMapOverlaysProps = {
  shapes: Shape[];
  nodes: FacilityNode[];
};

function IndoorMapOverlays({ shapes, nodes }: IndoorMapOverlaysProps) {
  return (
    <>
      {shapes.map((shape) => {
        const style = SHAPE_STYLES[shape.category ?? ""] ?? DEFAULT_SHAPE_STYLE;
        return (
          <NaverMapPolygonOverlay
            key={`floor-shape-${shape.id}`}
            coords={shape.coords}
            color={style.fill}
            outlineWidth={1.5}
            outlineColor={style.outline}
          />
        );
      })}

      {shapes.map((shape) => {
        if (!shape.label) {
          return null;
        }
        const labelCenter = centroidOfRing(shape.coords);
        if (!labelCenter) {
          return null;
        }
        return (
          <NaverMapMarkerOverlay
            key={`room-label-${shape.id}`}
            latitude={labelCenter.latitude}
            longitude={labelCenter.longitude}
            width={90}
            height={16}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View key={`label-view-${shape.id}`} collapsable={false}>
              <Text style={styles.roomLabelText} numberOfLines={1}>
                {shape.label}
              </Text>
            </View>
          </NaverMapMarkerOverlay>
        );
      })}

      {nodes.map((node) => (
        <NaverMapMarkerOverlay
          key={`facility-node-${node.id}`}
          latitude={node.lat}
          longitude={node.lng}
          width={24}
          height={24}
          anchor={{ x: 0.5, y: 0.5 }}
          caption={{ text: node.name ?? "", textSize: 11, color: "#111827", haloColor: "#ffffff", offset: 2 }}
        >
          <View
            key={`facility-icon-${node.nodeType}-${node.isCheckpoint}`}
            collapsable={false}
            style={[styles.nodeMarker, { backgroundColor: node.isCheckpoint ? "#f59e0b" : "#16a34a" }]}
          >
            <Text style={styles.nodeMarkerEmoji}>{FACILITY_EMOJI[node.nodeType] ?? "📍"}</Text>
          </View>
        </NaverMapMarkerOverlay>
      ))}
    </>
  );
}

function formatFloorLabel(floor: number): string {
  return floor > 0 ? `${floor}F` : `B${-floor}`;
}

type Shape = {
  id: string;
  label?: string;
  category?: string;
  coords: Coord[];
};

// 백엔드 GeoJSON은 Polygon/MultiPolygon을 느슨한 타입(unknown)으로 내려주므로 좌표를 직접 파싱한다.
// TODO: 실제 도면 데이터로 렌더링 검증 시 exterior ring의 winding 방향(Naver는 시계 방향 요구)을 확인할 것.
function extractShapes(geojson: FloorGeoJson): Shape[] {
  const shapes: Shape[] = [];

  geojson.features.forEach((feature, featureIndex) => {
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

  if (geometry.type === "Polygon") {
    return toRings(geometry.coordinates as number[][][]);
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as number[][][][]).flatMap(toRings);
  }

  return [];
}

function toRings(rings: number[][][]): Coord[][] {
  const [exteriorRing] = rings;
  if (!exteriorRing) {
    return [];
  }
  return [exteriorRing.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))];
}

function centroidOfRing(ring: Coord[]): Coord | null {
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

function centerOfNodes(nodes: FacilityNode[]): Coord | null {
  const first = nodes[0];
  return first ? { latitude: first.lat, longitude: first.lng } : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  errorText: {
    color: "#b91c1c",
    fontFamily: "monospace",
    fontSize: 12,
    textAlign: "center"
  },
  overlayCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)"
  },
  floorSelector: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  floorButton: {
    minWidth: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  floorButtonActive: {
    backgroundColor: "#2563eb"
  },
  floorButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600"
  },
  floorButtonTextActive: {
    color: "#ffffff"
  },
  nodeMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3
  },
  nodeMarkerEmoji: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff"
  },
  roomLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center"
  },
  placeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5
  },
  placeMarkerEmoji: {
    fontSize: 18
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600"
  }
});
