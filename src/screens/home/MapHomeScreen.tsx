import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/common/Text";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

import {
  MapHomeBottomSheetProvider,
  useMapHomeBottomSheet
} from "./MapHomeBottomSheetProvider";
import {
  mapHomeBottomSheetSelectionKind,
  rawPlaceFixtures,
  transformPlaceToSelectionData,
  type PlaceRawData
} from "./mapHomeBottomSheetContent";

/**
 * [지도 홈 화면 - 장소 상태 세팅 검증 컴포넌트]
 * 
 * 지도 위 마커 핀/칩 UI 확정 전까지, 장소 목록을 버튼 형식으로 단순 렌더링하여
 * 마커 클릭 시 MapHomeBottomSheetProvider의 selection 상태가 정상 초기화/업데이트되는지 테스트합니다.
 */
function MapCanvasContent() {
  const { selection, showEmpty, showPlace } = useMapHomeBottomSheet();

  return (
    <View style={styles.canvas}>
      <Text style={styles.guideTitle} variant="body-2" weight="bold">
        지도 장소 선택 (아래 내용들은 모두 버튼 형식이고 추후에 맵 위에 마커로 표시되용)
      </Text>

      <ScrollView contentContainerStyle={styles.buttonList} showsVerticalScrollIndicator={false}>
        {/* 선택 초기화 버튼 */}
        <Pressable
          accessibilityRole="button"
          onPress={showEmpty}
          style={({ pressed }) => [
            styles.resetButton,
            pressed ? styles.buttonPressed : null,
            selection.kind === mapHomeBottomSheetSelectionKind.empty ? styles.resetButtonActive : null
          ]}
        >
          <Text
            color={
              selection.kind === mapHomeBottomSheetSelectionKind.empty
                ? colors.text.primary
                : colors.text.secondary
            }
            variant="body-3"
            weight="semibold"
          >
            초기 상태로 리셋 (Empty)
          </Text>
        </Pressable>

        {/* 9종 실사 장소 테스트 버튼 목록 */}
        {rawPlaceFixtures.map((place: PlaceRawData) => {
          const selectionData = transformPlaceToSelectionData(place);
          const isSelected =
            selection.kind === mapHomeBottomSheetSelectionKind.place &&
            selection.data.id === selectionData.id;

          return (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() => showPlace(selectionData)}
              style={({ pressed }) => [
                styles.placeButton,
                pressed ? styles.buttonPressed : null,
                isSelected ? styles.placeButtonSelected : null
              ]}
            >
              <Text
                color={isSelected ? colors.text.primary : colors.text.secondary}
                variant="body-3"
                weight={isSelected ? "bold" : "medium"}
              >
                {place.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function MapHomeScreen() {
  return (
    <MapHomeBottomSheetProvider>
      <MapCanvasContent />
    </MapHomeBottomSheetProvider>
  );
}

const styles = StyleSheet.create({
  buttonList: {
    gap: spacing[2],
    padding: spacing[4],
    paddingBottom: 120
  },
  buttonPressed: {
    opacity: 0.75
  },
  canvas: {
    backgroundColor: colors.background.light,
    flex: 1
  },
  guideTitle: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4]
  },
  placeButton: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  placeButtonSelected: {
    borderColor: colors.border.focus,
    borderWidth: 2
  },
  resetButton: {
    backgroundColor: colors.background.regular,
    borderColor: colors.border.regular,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  resetButtonActive: {
    borderColor: colors.border.focus,
    borderWidth: 2
  }
});
