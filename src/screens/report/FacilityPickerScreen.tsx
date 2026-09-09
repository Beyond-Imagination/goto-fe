import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpKindChips, HelpPrimaryButton } from '@/components/help';
import { ErrorView } from '@/components/myinfo/LoadStateView';
import { useAsyncResource } from '@/myinfo';
import type { FacilityNode } from '@/placeApi';
import { FACILITY_NODE_TYPE_LABELS, formatFloorLevel, useReportDraft } from '@/report';
import { usePlaceApi } from '@/usePlaceApi';
import { colors } from '@/styles/tokens/colors';

type FacilityPickerScreenProps = {
  readonly onBack: () => void;
  readonly onNext: () => void;
};

function toNodeLabel(node: FacilityNode): string {
  const typeLabel = FACILITY_NODE_TYPE_LABELS[node.nodeType] ?? node.nodeType;
  return node.name ?? typeLabel;
}

/**
 * 제보 06 전반 — 어떤 시설인가요?
 * 실내 도면이 있는 층을 고르고 그 층의 시설 노드를 선택합니다.
 * (BE는 제보를 nodeId에 붙이므로 이 선택 없이는 등록할 수 없습니다.)
 */
export function FacilityPickerScreen({ onBack, onNext }: FacilityPickerScreenProps) {
  const insets = useSafeAreaInsets();
  const placeApi = usePlaceApi();
  const { draft, patchDraft } = useReportDraft();

  const placeId = draft.placeId;
  const [floor, setFloor] = useState<number | null>(null);

  const loadFloors = useCallback(async (): Promise<number[]> => {
    if (placeId === null) {
      return [];
    }
    return placeApi.listFloors(placeId);
  }, [placeApi, placeId]);
  const floors = useAsyncResource(loadFloors, '층 정보를 불러오지 못했어요.');

  // 층을 고르기 전에는 첫 번째 층을 기본값으로 씁니다.
  const selectedFloor = floor ?? floors.data?.[0] ?? null;

  const loadNodes = useCallback(async (): Promise<FacilityNode[]> => {
    if (placeId === null || selectedFloor === null) {
      return [];
    }
    return placeApi.listFacilityNodes(placeId, selectedFloor);
  }, [placeApi, placeId, selectedFloor]);
  const nodes = useAsyncResource(loadNodes, '시설 목록을 불러오지 못했어요.');

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="시설 상태 제보" />

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text color={colors.text.secondary} variant="body-2">
          {draft.placeName ?? '선택한 장소'}
        </Text>
        <Text color={colors.text.primary} variant="title-2" weight="semibold">
          어떤 시설인가요?
        </Text>

        {placeId === null ? (
          <Text color={colors.text.secondary} variant="body-3">
            먼저 이전 화면에서 실내 지도가 있는 장소를 선택해주세요.
          </Text>
        ) : null}

        {floors.state === 'loading' ? (
          <ActivityIndicator color={colors.brand.mainAlt} style={styles.loading} />
        ) : null}

        {floors.state === 'error' ? (
          <ErrorView message={floors.errorMessage ?? '층 정보를 불러오지 못했어요.'} onRetry={floors.reload} />
        ) : null}

        {floors.state === 'success' && (floors.data ?? []).length === 0 && placeId !== null ? (
          <Text color={colors.text.secondary} variant="body-3">
            이 장소는 아직 실내 도면이 없어요. 길 위 장애물이나 장소 상태로 제보해주세요.
          </Text>
        ) : null}

        {(floors.data ?? []).length > 0 ? (
          <>
            <Text color={colors.text.primary} style={styles.sectionTitle} variant="body-1" weight="semibold">
              층
            </Text>
            <HelpKindChips
              onToggle={value => {
                setFloor(Number(value));
                // 층이 바뀌면 이전 층에서 고른 시설 선택은 버립니다.
                patchDraft({ facilityNodeId: null, facilityNodeLabel: null, facilityFloorLevel: null });
              }}
              options={(floors.data ?? []).map(level => String(level))}
              renderLabel={value => formatFloorLevel(Number(value))}
              selected={selectedFloor === null ? [] : [String(selectedFloor)]}
            />
          </>
        ) : null}

        {nodes.state === 'loading' && selectedFloor !== null ? (
          <ActivityIndicator color={colors.brand.mainAlt} style={styles.loading} />
        ) : null}

        {nodes.state === 'error' ? (
          <ErrorView message={nodes.errorMessage ?? '시설 목록을 불러오지 못했어요.'} onRetry={nodes.reload} />
        ) : null}

        {nodes.state === 'success' && (nodes.data ?? []).length === 0 && selectedFloor !== null ? (
          <Text color={colors.text.secondary} style={styles.sectionTitle} variant="body-3">
            이 층에는 등록된 시설이 없어요. 다른 층을 골라보세요.
          </Text>
        ) : null}

        {(nodes.data ?? []).map(node => {
          const isSelected = draft.facilityNodeId === node.id;
          const typeLabel = FACILITY_NODE_TYPE_LABELS[node.nodeType] ?? node.nodeType;

          return (
            <Pressable
              accessibilityLabel={toNodeLabel(node)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={node.id}
              onPress={() =>
                patchDraft({
                  facilityNodeId: node.id,
                  facilityNodeLabel: toNodeLabel(node),
                  facilityFloorLevel: selectedFloor,
                })
              }
              style={[styles.card, isSelected ? styles.cardSelected : null]}
            >
              <Text
                color={isSelected ? colors.brand.mainAlt : colors.text.primary}
                variant="body-1"
                weight="semibold"
              >
                {isSelected ? '◉ ' : '○ '}
                {toNodeLabel(node)}
              </Text>
              <Text
                color={isSelected ? colors.brand.mainAlt : colors.text.secondary}
                variant="body-3"
              >
                {typeLabel}
                {node.locationDescription ? ` · ${node.locationDescription}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <HelpPrimaryButton
          disabled={draft.facilityNodeId === null}
          label="다음"
          onPress={onNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  progress: {
    backgroundColor: colors.border.light,
    height: 4,
    marginHorizontal: HELP_SCREEN_X,
  },
  progressFill: {
    backgroundColor: colors.brand.mainAlt,
    height: 4,
    width: '66%',
  },
  content: {
    gap: 10,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  sectionTitle: {
    marginTop: 12,
  },
  loading: {
    marginVertical: 12,
  },
  card: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 18,
  },
  cardSelected: {
    backgroundColor: colors.background.light,
    borderColor: colors.brand.mainAlt,
  },
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
