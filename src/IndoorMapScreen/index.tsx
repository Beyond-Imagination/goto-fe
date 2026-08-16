import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import {
  NaverMapMarkerOverlay,
  NaverMapPolygonOverlay,
  NaverMapView,
  type Coord,
  type NaverMapViewRef
} from "@mj-studio/react-native-naver-map";
import Svg, { Path } from "react-native-svg";

import { FacilityNode, fetchFacilityNodes, fetchFloors, fetchIndoorMap } from "../indoorMapApi";
import { createHelpRequest } from "../helpRequestApi";
import { useLiveLocation } from "./useLiveLocation";
import {
  DEFAULT_CENTER,
  DEFAULT_SHAPE_STYLE,
  FACILITY_EMOJI,
  INDOOR_MAX_ZOOM,
  SHAPE_STYLES,
  centerOfNodes,
  centroidOfRing,
  extractShapes,
  facilityLabel,
  fitCameraToBounds,
  formatFloorKorean,
  formatFloorLabel
} from "./geo";
import { styles } from "./styles";
import type { IndoorMapOverlaysProps, IndoorMapScreenProps, MapData, ScreenMode } from "./types";

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
  }, [mode, mapData]);

  // 실내 도면에서 현재 위치 오버레이(파란 점)를 켠다. 네이티브 트래킹 모드(NoFollow)에
  // 맡기면 accuracy나 raw fix를 JS에서 전혀 볼 수 없어 GPS 튐을 걸러낼 방법이 없으므로,
  // 직접 GPS를 구독해 필터링/스무딩한 뒤 locationOverlay를 controlled로 그린다.
  // 카메라는 따라 움직이지 않는다 — 도면을 보다가 카메라가 임의로 이동하면 방향 감각을
  // 잃기 쉽기 때문.
  const liveLocation = useLiveLocation(mode === "indoor");

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.floorSelector}
          >
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
          </ScrollView>
        </View>
      )}

      <View style={styles.mapArea}>
        <NaverMapView
          ref={mapRef}
          style={[styles.map, mode === "indoor" && styles.mapIndoor]}
          camera={camera}
          mapType={mode === "indoor" ? "None" : "Basic"}
          // circleRadius는 픽셀 단위라 미터 단위 accuracy를 그대로 원 크기로 옮기려면
          // 줌 레벨별 변환이 필요하다 — 대신 정확도는 아래 뱃지(±Nm 텍스트)로 보여준다.
          locationOverlay={{
            isVisible: mode === "indoor" && liveLocation !== null,
            position: liveLocation?.position
          }}
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
