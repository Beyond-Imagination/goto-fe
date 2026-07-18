import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NaverMapCircleOverlay, NaverMapPolygonOverlay, NaverMapView, type Coord } from "@mj-studio/react-native-naver-map";

import { FacilityNode, FloorGeoJson, GeoJsonFeature, fetchFacilityNodes, fetchIndoorMap } from "./indoorMapApi";

const DEFAULT_CENTER: Coord = { latitude: 37.5796, longitude: 126.977 };

type IndoorMapScreenProps = {
  accessToken: string;
  placeId: number;
  floor: number;
};

type LoadState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "ready"; geojson: FloorGeoJson; nodes: FacilityNode[] };

export function IndoorMapScreen({ accessToken, placeId, floor }: IndoorMapScreenProps) {
  const [state, setState] = useState<LoadState>({ type: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ type: "loading" });
      try {
        const [geojson, nodes] = await Promise.all([
          fetchIndoorMap(accessToken, placeId, floor),
          fetchFacilityNodes(accessToken, placeId, floor)
        ]);
        if (!cancelled) {
          setState({ type: "ready", geojson, nodes });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            type: "error",
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, placeId, floor]);

  if (state.type === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.type === "error") {
    return (
      <View style={styles.center}>
        <Text selectable style={styles.errorText}>
          {state.message}
        </Text>
      </View>
    );
  }

  const polygons = extractPolygons(state.geojson);
  const center = centroidOfPolygons(polygons) ?? centerOfNodes(state.nodes) ?? DEFAULT_CENTER;

  return (
    <NaverMapView style={styles.map} initialCamera={{ ...center, zoom: 18 }}>
      {polygons.map((coords, index) => (
        <NaverMapPolygonOverlay
          key={`floor-shape-${index}`}
          coords={coords}
          color="rgba(96, 165, 250, 0.35)"
          outlineWidth={2}
          outlineColor="#2563eb"
        />
      ))}

      {state.nodes.map((node) => (
        <NaverMapCircleOverlay
          key={`facility-node-${node.id}`}
          latitude={node.lat}
          longitude={node.lng}
          radius={4}
          color={node.isCheckpoint ? "#f59e0b" : "#16a34a"}
          outlineWidth={2}
          outlineColor="#ffffff"
        />
      ))}
    </NaverMapView>
  );
}

// 백엔드 GeoJSON은 Polygon/MultiPolygon을 느슨한 타입(unknown)으로 내려주므로 좌표를 직접 파싱한다.
// TODO: 실제 도면 데이터로 렌더링 검증 시 exterior ring의 winding 방향(Naver는 시계 방향 요구)을 확인할 것.
function extractPolygons(geojson: FloorGeoJson): Coord[][] {
  const polygons: Coord[][] = [];

  for (const feature of geojson.features) {
    for (const ring of extractRings(feature)) {
      polygons.push(ring);
    }
  }

  return polygons;
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

function centroidOfPolygons(polygons: Coord[][]): Coord | null {
  const ring = polygons[0];
  if (!ring || ring.length === 0) {
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
  }
});
