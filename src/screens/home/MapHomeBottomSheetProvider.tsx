import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  BottomSheet,
  bottomSheetSnap,
  type BottomSheetContent,
  type BottomSheetSnap
} from "@/components/common/bottomSheet";
import { Text } from "@/components/common/Text";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { shadows } from "@/styles/tokens/shadows";
import { spacing } from "@/styles/tokens/spacing";

import {
  getMapHomeBottomSheetSelectionData,
  mapHomeBottomSheetItemKey,
  mapHomeBottomSheetSelection,
  mapHomeBottomSheetSelectionKind,
  type MapHomeBottomSheetItem,
  type MapHomeBottomSheetSelection,
  type MapHomeBottomSheetSelectionData
} from "./mapHomeBottomSheetContent";

type MapHomeBottomSheetControls = {
  /** 현재 선택 상태 (empty | facility | place) */
  readonly selection: MapHomeBottomSheetSelection;
  /** 선택 상태를 초기화하고 기본 빈(empty) 안내 문구를 표시 */
  readonly showEmpty: () => void;
  /** 시설물이 선택되었을 때 시설물 데이터(data)를 전달받아 바텀시트에 정보 표출 */
  readonly showFacility: (data: MapHomeBottomSheetSelectionData) => void;
  /** 장소가 선택되었을 때 장소 데이터(data)를 전달받아 바텀시트에 정보 표출 */
  readonly showPlace: (data: MapHomeBottomSheetSelectionData) => void;
};

type MapHomeBottomSheetProviderProps = {
  readonly children: ReactNode;
};

const MapHomeBottomSheetContext = createContext<MapHomeBottomSheetControls | null>(null);

const renderMapHomeBottomSheetItem: BottomSheetContent<MapHomeBottomSheetItem>["renderItem"] = ({
  item
}) => (
  <View style={styles.card}>
    <Text variant="body-2" weight="semibold">
      {item.title}
    </Text>
    <Text color={colors.text.secondary} variant="body-3" weight="medium">
      {item.description}
    </Text>
  </View>
);

export function MapHomeBottomSheetProvider({ children }: MapHomeBottomSheetProviderProps) {
  const insets = useSafeAreaInsets();
  // 1. 선택 상태: empty(초기 상태), facility(시설물 선택), place(장소 선택)
  const [selection, setSelection] = useState<MapHomeBottomSheetSelection>(
    mapHomeBottomSheetSelection.empty
  );
  // 2. 바텀시트 스냅 리셋 트리거 ID
  const [snapRequestId, setSnapRequestId] = useState(0);
  // 3. 바텀시트 현재 스냅(펼침/접힘) 상태
  const [snap, setSnap] = useState<BottomSheetSnap>(bottomSheetSnap.peek);

  /** 공통: 선택 상태를 전환하고 바텀시트 위치를 기본 peek 상태로 트리거 */
  const showSelection = useCallback((nextSelection: MapHomeBottomSheetSelection) => {
    setSelection(nextSelection);
    setSnap(bottomSheetSnap.peek);
    setSnapRequestId((currentRequestId) => currentRequestId + 1);
  }, []);

  /** [empty] 아무것도 선택되지 않은 초기 탐색 안내 표출 */
  const showEmpty = useCallback(() => {
    showSelection(mapHomeBottomSheetSelection.empty);
  }, [showSelection]);

  /** [facility] 선택한 시설물 데이터 바인딩 및 바텀시트 표출 */
  const showFacility = useCallback(
    (data: MapHomeBottomSheetSelectionData) => {
      showSelection({ data, kind: mapHomeBottomSheetSelectionKind.facility });
    },
    [showSelection]
  );

  /** [place] 선택한 장소 데이터 바인딩 및 바텀시트 표출 */
  const showPlace = useCallback(
    (data: MapHomeBottomSheetSelectionData) => {
      showSelection({ data, kind: mapHomeBottomSheetSelectionKind.place });
    },
    [showSelection]
  );
  const controls = useMemo<MapHomeBottomSheetControls>(
    () => ({ selection, showEmpty, showFacility, showPlace }),
    [selection, showEmpty, showFacility, showPlace]
  );
  const content = useMemo<BottomSheetContent<MapHomeBottomSheetItem>>(() => {
    const data = getMapHomeBottomSheetSelectionData(selection);
    const contentKey =
      selection.kind === mapHomeBottomSheetSelectionKind.empty
        ? mapHomeBottomSheetSelectionKind.empty
        : `${selection.kind}:${data.id}`;

    return {
      contentKey,
      data: data.items,
      keyExtractor: mapHomeBottomSheetItemKey,
      renderItem: renderMapHomeBottomSheetItem,
      summary: data.summary,
      title: data.title
    };
  }, [selection]);
  const shouldShowReopen = snap === bottomSheetSnap.collapsed;

  const reopenSheet = useCallback(() => {
    setSnap(bottomSheetSnap.peek);
    setSnapRequestId((currentRequestId) => currentRequestId + 1);
  }, []);

  return (
    <MapHomeBottomSheetContext.Provider value={controls}>
      <View style={styles.screen}>
        {children}
        <BottomSheet
          content={content}
          initialSnap={bottomSheetSnap.peek}
          onSnapChange={setSnap}
          snapRequestId={snapRequestId}
        />
        {shouldShowReopen ? (
          <Pressable
            accessibilityHint="주변 탐색 바텀시트를 다시 엽니다."
            accessibilityLabel="바텀시트 다시 열기"
            accessibilityRole="button"
            onPress={reopenSheet}
            style={({ pressed }) => [
              styles.reopenButton,
              pressed ? styles.reopenButtonPressed : null,
              { bottom: insets.bottom + spacing[5] }
            ]}
          >
            <ChevronUpIcon color={colors.text.primary} size={16} />
            <Text variant="body-3" weight="semibold">
              {selection.kind === mapHomeBottomSheetSelectionKind.empty
                ? "주변 정보 탐색"
                : content.title}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </MapHomeBottomSheetContext.Provider>
  );
}

export function useMapHomeBottomSheet(): MapHomeBottomSheetControls {
  const controls = useContext(MapHomeBottomSheetContext);

  if (controls === null) {
    throw new Error("useMapHomeBottomSheet must be used inside MapHomeBottomSheetProvider.");
  }

  return controls;
}

function ChevronUpIcon({
  color = colors.text.primary,
  size = 18
}: {
  readonly color?: string;
  readonly size?: number;
}) {
  return (
    <Svg
      fill="none"
      height={size}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width={size}
    >
      <Path d="M18 15l-6-6-6 6" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.regular,
    borderRadius: radius["2xl"],
    gap: spacing[1],
    padding: spacing[5]
  },
  reopenButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[1.5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    position: "absolute",
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(16px)" } as any) : {}),
    ...shadows.md
  },
  reopenButtonPressed: {
    backgroundColor: "rgba(240, 240, 240, 0.95)",
    transform: [{ scale: 0.97 }]
  },
  screen: {
    backgroundColor: colors.background.light,
    flex: 1
  }
});
