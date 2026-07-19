import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
  NaverMapView,
  type Coord,
  type NaverMapViewRef
} from "@mj-studio/react-native-naver-map";
import Svg, { Path } from "react-native-svg";

import {
  FacilityNode,
  FloorGeoJson,
  GeoJsonFeature,
  fetchFacilityNodes,
  fetchFloors,
  fetchIndoorMap
} from "./indoorMapApi";
import { createHelpRequest } from "./helpRequestApi";

const DEFAULT_CENTER: Coord = { latitude: 37.5796, longitude: 126.977 };
// 네이버 지도 SDK의 사실상 최대 줌 레벨. 실내 도면 진입/노드 선택 시 이 값으로 통일해서
// 노드를 선택했을 때 도면이 오히려 축소되어 보이는 일이 없도록 한다.
const INDOOR_MAX_ZOOM = 21;

// 폴리곤 category별 스타일. 실제 역사 도면 관례(유료/무료 구역, 개찰구)를 참고하되
// 채도를 낮춰 그레이톤으로 통일함 (구역 구분은 색보다 옅은 명암 차이로만 표현).
const SHAPE_STYLES: Record<string, { fill: string; outline: string }> = {
  room: { fill: "#fafaf9", outline: "#d7dbd8" },
  corridor: { fill: "#ffffff", outline: "#e2e5e3" },
  unpaid_zone: { fill: "#eef1ee", outline: "#c3ccc5" },
  paid_zone: { fill: "#eef0f3", outline: "#c1c9d1" },
  gate: { fill: "#faf3e3", outline: "#e0a825" }
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

const FACILITY_LABEL: Record<string, string> = {
  ELEVATOR: "엘리베이터",
  STAIRS: "계단",
  RESTROOM: "화장실",
  INFO_DESK: "안내데스크",
  TICKET_MACHINE: "발권기",
  WIDE_GATE: "게이트",
  STAFF_ROOM: "직원실",
  PANTRY: "탕비실"
};

function facilityLabel(node: FacilityNode): string {
  return node.name ?? FACILITY_LABEL[node.nodeType] ?? node.nodeType;
}

function BackIcon({ size = 20, color = "#111827" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BookmarkIcon({ size = 18, color = "#111827" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12v18l-6-4-6 4V3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PinIcon({ size = 15, color = "#111827" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C7.6 2 4 5.6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
    </Svg>
  );
}

type IndoorMapScreenProps = {
  accessToken: string;
  placeId: number;
  placeName?: string;
};

type MapData = { shapes: Shape[]; nodes: FacilityNode[] };
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
  // 장소의 대표 위치. 최초 도면 로딩 성공 시 한 번만 설정하고 이후 층을 옮겨도 유지한다
  // (야외 지도에서 보여줄 마커 위치가 현재 보고 있던 층에 따라 흔들리지 않도록).
  const [placeCenter, setPlaceCenter] = useState<Coord | null>(null);
  const [mode, setMode] = useState<ScreenMode>("outdoor");
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isSendingHelpRequest, setIsSendingHelpRequest] = useState(false);
  const mapRef = useRef<NaverMapViewRef>(null);

  function handleSelectNode(node: FacilityNode) {
    setSelectedNodeId(node.id);
    // fitCameraToBounds가 진입 시 이미 최대 줌(INDOOR_MAX_ZOOM)까지 당겨두므로,
    // 그보다 낮은 줌으로 이동하면 오히려 도면이 축소되어 보인다. 같은 줌을 유지한 채 위치만 이동.
    mapRef.current?.animateCameraTo({ latitude: node.lat, longitude: node.lng, zoom: INDOOR_MAX_ZOOM, duration: 300 });
  }

  function handleUnavailableAction(label: string) {
    Alert.alert(label, "아직 준비 중인 기능이에요.");
  }

  async function handleSendHelpRequest(node: FacilityNode) {
    if (floor === null || isSendingHelpRequest) {
      return;
    }

    setIsSendingHelpRequest(true);
    try {
      await createHelpRequest(accessToken, {
        placeId,
        locationLabel: `${placeName ?? "장소"} ${formatFloorLabel(floor)} ${facilityLabel(node)}`,
        latitude: node.lat,
        longitude: node.lng,
        floorLevel: floor,
        message: `${facilityLabel(node)} 근처에서 도움이 필요해요.`
      });
      Alert.alert("도움 요청을 보냈어요", "근처 도우미에게 알림이 전달됩니다.");
    } catch (error) {
      Alert.alert("요청 실패", error instanceof Error ? error.message : String(error));
    } finally {
      setIsSendingHelpRequest(false);
    }
  }

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
    setSelectedNodeId(null);
  }, [floor]);

  // 이미 층 데이터를 불러온 상태에서 야외→실내로 전환할 때도(층 자체는 안 바뀜)
  // 도면 전체가 보이도록 다시 맞춰준다.
  // 전환 직후엔 상단바/층탭이 막 나타나며 NaverMapView의 네이티브 레이아웃이 아직
  // 줄어들기 전이라, 다음 프레임으로 한 틱 미뤄서 카메라를 맞춘다.
  useEffect(() => {
    if (mode !== "indoor" || !mapData) {
      return;
    }

    const timer = setTimeout(() => {
      fitCameraToBounds(mapRef.current, mapData.shapes, mapData.nodes);
    }, 100);

    return () => clearTimeout(timer);
  }, [mode]);

  // 실내 도면에서 현재 위치 오버레이(파란 점)를 켠다. 카메라는 따라 움직이지 않고
  // (NoFollow) 점만 사용자의 실제 GPS 위치를 따라간다 — 도면을 보다가 카메라가
  // 임의로 이동하면 방향 감각을 잃기 쉽기 때문.
  useEffect(() => {
    mapRef.current?.setLocationTrackingMode(mode === "indoor" ? "NoFollow" : "None");
  }, [mode]);

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
          setPlaceCenter((prev) => prev ?? center);
          setMapData({ shapes, nodes });
          fitCameraToBounds(mapRef.current, shapes, nodes);
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
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIllustration}>
          <Text style={styles.emptyStateIllustrationEmoji}>🏢</Text>
        </View>
        <Text style={styles.emptyStateTitle}>아직 실내 지도가 없어요</Text>
        <Text style={styles.emptyStateDescription}>
          이 장소는 공식 정보와{"\n"}사용자 제보로 접근성을 확인할 수 있어요
        </Text>
        <Pressable style={styles.emptyPrimaryButton} onPress={() => handleUnavailableAction("시설 상태 보기")}>
          <Text style={styles.emptyPrimaryButtonText}>시설 상태 보기</Text>
        </Pressable>
        <Pressable style={styles.emptySecondaryButton} onPress={() => handleUnavailableAction("지도 데이터 제안")}>
          <Text style={styles.emptySecondaryButtonText}>지도 데이터 제안</Text>
        </Pressable>
      </View>
    );
  }

  const selectedNode = mapData?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  // 실내 모드에서는 camera를 넘기지 않고 fitCameraToBounds/animateCameraTo로 직접 움직인다 —
  // controlled camera prop을 계속 넘기면 imperative 이동과 매 렌더마다 충돌한다.
  const camera = mode === "outdoor" ? { ...(placeCenter ?? DEFAULT_CENTER), zoom: 16 } : undefined;

  return (
    <View style={styles.container}>
      {mode === "indoor" && (
        <View style={styles.indoorHeader}>
          <View style={styles.navbar}>
            <Pressable style={styles.navIconButton} onPress={() => setMode("outdoor")} hitSlop={8}>
              <BackIcon />
            </Pressable>
            <Text style={styles.navTitle}>실내 지도</Text>
            <Pressable style={styles.navIconButton} onPress={() => handleUnavailableAction("저장")} hitSlop={8}>
              <BookmarkIcon />
            </Pressable>
          </View>

          <Pressable style={styles.placeRow} onPress={() => handleUnavailableAction("장소 변경")}>
            <PinIcon />
            <Text style={styles.placeRowText} numberOfLines={1}>
              {placeName ?? "장소"}
            </Text>
            <Text style={styles.placeRowChevron}>⌄</Text>
          </Pressable>

          <View style={styles.floorSelector}>
            {floors.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFloor(f)}
                style={[styles.floorTab, f === floor && styles.floorTabActive]}
              >
                <Text style={[styles.floorTabText, f === floor && styles.floorTabTextActive]}>
                  {formatFloorLabel(f)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.mapArea}>
        <NaverMapView
          ref={mapRef}
          style={[styles.map, mode === "indoor" && styles.mapIndoor]}
          camera={camera}
          mapType={mode === "indoor" ? "None" : "Basic"}
        >
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

          {mode === "indoor" && mapData && (
            <IndoorMapOverlays shapes={mapData.shapes} nodes={mapData.nodes} onNodePress={handleSelectNode} />
          )}
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

            {selectedNode ? (
            <View style={styles.nodeSheet}>
              <View style={styles.nodeSheetHandle} />
              <View style={styles.nodeSheetHeader}>
                <Text style={styles.nodeSheetTitle}>
                  {formatFloorLabel(floor as number)} {facilityLabel(selectedNode)}
                </Text>
                <Pressable onPress={() => setSelectedNodeId(null)} hitSlop={8}>
                  <Text style={styles.nodeSheetCloseText}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.nodeStatusRow}>
                <View style={styles.nodeStatusChip}>
                  <Text style={styles.nodeStatusChipText}>상태 정보 없음</Text>
                </View>
                <Text style={styles.nodeStatusMeta}>아직 제보된 상태 정보가 없어요</Text>
              </View>

              <View style={styles.nodeActionRow}>
                <Pressable
                  style={styles.nodeActionButton}
                  onPress={() => handleUnavailableAction("상태 제보하기")}
                >
                  <Text style={styles.nodeActionButtonText}>상태 제보하기</Text>
                </Pressable>
                <Pressable
                  style={styles.nodeActionButton}
                  onPress={() => handleUnavailableAction("위치가 달라요")}
                >
                  <Text style={styles.nodeActionButtonText}>위치가 달라요</Text>
                </Pressable>
                <Pressable
                  style={styles.nodeActionButton}
                  disabled={isSendingHelpRequest}
                  onPress={() => handleSendHelpRequest(selectedNode)}
                >
                  {isSendingHelpRequest ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.nodeActionButtonText}>도움 요청하기</Text>
                  )}
                </Pressable>
              </View>

              {selectedNode.locationDescription && (
                <View style={styles.nodeLocNote}>
                  <PinIcon size={14} color="#166258" />
                  <View style={styles.nodeLocNoteTextGroup}>
                    <Text style={styles.nodeLocNoteTitle}>{selectedNode.locationDescription}</Text>
                    <Text style={styles.nodeLocNoteFloor}>{formatFloorKorean(floor as number)}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            mapData &&
            mapData.nodes.length > 0 && (
              <View style={styles.facilityDrawer}>
                <View style={styles.nodeSheetHandle} />
                <Text style={styles.facilityDrawerTitle}>{formatFloorLabel(floor as number)} 주요 시설</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facilityList}>
                  {mapData.nodes.map((node) => (
                    <Pressable
                      key={`facility-quick-${node.id}`}
                      style={styles.facilityItem}
                      onPress={() => handleSelectNode(node)}
                    >
                      <View style={styles.facilityItemIcon}>
                        <Text style={styles.facilityItemEmoji}>{FACILITY_EMOJI[node.nodeType] ?? "📍"}</Text>
                      </View>
                      <Text style={styles.facilityItemLabel} numberOfLines={1}>
                        {facilityLabel(node)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )
          )}
        </>
      )}
      </View>
    </View>
  );
}

type IndoorMapOverlaysProps = {
  shapes: Shape[];
  nodes: FacilityNode[];
  onNodePress: (node: FacilityNode) => void;
};

function IndoorMapOverlays({ shapes, nodes, onNodePress }: IndoorMapOverlaysProps) {
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
          onTap={() => onNodePress(node)}
        >
          <View key={`facility-icon-${node.nodeType}`} collapsable={false} style={styles.nodeMarker}>
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

function formatFloorKorean(floor: number): string {
  return floor > 0 ? `${floor}층` : `지하${-floor}층`;
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

// 도면(방+시설 노드) 중심으로 최대 줌까지 당겨서 보여준다.
// 도면의 실제 위경도 bbox 가로세로 비율이 폰 화면(세로로 긴) 비율과 다르면
// 한쪽 방향은 꽉 차고 반대쪽엔 여백이 남을 수 있다 — 실제 도면 형태(예: 좌우로
// 긴 승강장형 레이아웃)에 따른 자연스러운 한계이며 카메라 값으로 해소되지 않는다.
function fitCameraToBounds(map: NaverMapViewRef | null, shapes: Shape[], nodes: FacilityNode[]) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  mapIndoor: {
    backgroundColor: "#fbfbfa"
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
  indoorHeader: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 6
  },
  navIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  navTitle: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#111827"
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  placeRowText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1
  },
  placeRowChevron: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 2
  },
  mapArea: {
    flex: 1
  },
  floorSelector: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14
  },
  floorTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  floorTabActive: {
    backgroundColor: "#166258"
  },
  floorTabText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600"
  },
  floorTabTextActive: {
    color: "#ffffff"
  },
  nodeSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  nodeSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginBottom: 10
  },
  nodeSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  nodeSheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827"
  },
  nodeSheetCloseText: {
    fontSize: 16,
    color: "#6b7280",
    paddingHorizontal: 4
  },
  nodeStatusRow: {
    marginBottom: 14
  },
  nodeStatusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 6
  },
  nodeStatusChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280"
  },
  nodeStatusMeta: {
    fontSize: 12,
    color: "#6b7280"
  },
  nodeActionRow: {
    flexDirection: "row",
    gap: 8
  },
  nodeActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f6f7f5",
    minHeight: 44
  },
  nodeActionButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827"
  },
  nodeLocNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },
  nodeLocNoteTextGroup: {
    flex: 1
  },
  nodeLocNoteTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
    marginBottom: 2
  },
  nodeLocNoteFloor: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#6b7280",
    lineHeight: 16
  },
  facilityDrawer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  facilityDrawerTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 10
  },
  facilityList: {
    paddingHorizontal: 16
  },
  facilityItem: {
    alignItems: "center",
    marginRight: 14,
    width: 56
  },
  facilityItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#166258",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  facilityItemEmoji: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff"
  },
  facilityItemLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center"
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#ffffff"
  },
  emptyStateIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22
  },
  emptyStateIllustrationEmoji: {
    fontSize: 40
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8
  },
  emptyStateDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 26
  },
  emptyPrimaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    marginBottom: 10
  },
  emptyPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700"
  },
  emptySecondaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#111827",
    alignItems: "center"
  },
  emptySecondaryButtonText: {
    color: "#111827",
    fontSize: 14.5,
    fontWeight: "700"
  },
  nodeMarker: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#166258",
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
  }
});
