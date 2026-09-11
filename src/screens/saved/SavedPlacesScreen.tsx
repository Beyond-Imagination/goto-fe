import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X } from '@/components/help';
import { FilterChips } from '@/components/myinfo/FilterChips';
import { ListDivider } from '@/components/myinfo/ListDivider';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { SavedPlaceCard } from '@/components/saved/SavedPlaceCard';
import {
  SAVED_FILTERS,
  countNotificationEnabled,
  emptyFilterMessage,
  filterSavedPlaces,
  toSavedPlaceCard,
  useSavedPlaceApi,
  useSavedPlaces,
  type SavedFilter,
} from '@/saved';
import { colors } from '@/styles/tokens/colors';

type SavedPlacesScreenProps = {
  /** 장소 상세로 이동. 장소 상세 화면이 생기기 전에는 넘기지 않습니다. */
  readonly onOpenPlace?: (placeId: number) => void;
  /** 빈 상태에서 「지도에서 장소 찾기」를 눌렀을 때. */
  readonly onOpenMap: () => void;
};

/**
 * 저장 01·02 — 저장 탭.
 *
 * 저장은 장소 상세·검색 결과의 하트이고, 저장한 장소는 상태 변경 알림을 받습니다.
 * 카드의 스위치는 그 장소의 알림만 끄고, 어떤 알림을 받을지는 내 정보 › 알림 설정이 정합니다.
 */
export function SavedPlacesScreen({ onOpenPlace, onOpenMap }: SavedPlacesScreenProps) {
  const api = useSavedPlaceApi();
  const saved = useSavedPlaces(api);
  const [filter, setFilter] = useState<SavedFilter>('전체');

  const visible = useMemo(() => filterSavedPlaces(saved.places, filter), [saved.places, filter]);
  const notifiedCount = countNotificationEnabled(saved.places);

  if (saved.state === 'loading') {
    return (
      <View style={styles.screen}>
        <SavedHeader subtitle="저장한 장소를 불러오는 중입니다" />
        <LoadingView message="저장한 장소를 불러오는 중입니다..." />
      </View>
    );
  }

  if (saved.state === 'error') {
    return (
      <View style={styles.screen}>
        <SavedHeader subtitle="목록을 불러오지 못했습니다" />
        <ErrorView
          message={saved.errorMessage ?? '저장한 장소를 불러오지 못했어요.'}
          onRetry={saved.reload}
        />
      </View>
    );
  }

  if (saved.places.length === 0) {
    return (
      <View style={styles.screen}>
        <SavedHeader subtitle="아직 저장한 장소가 없습니다" />
        <View style={styles.empty}>
          <Text
            color={colors.text.primary}
            style={styles.emptyTitle}
            variant="title-2"
            weight="semibold"
          >
            저장한 장소가 없어요
          </Text>
          <Text color={colors.text.tertiary} style={styles.emptyBody} variant="body-2">
            {'장소 상세나 검색 결과에서 하트를 누르면\n여기에 모이고, 그 곳의 변화를 알려드려요.'}
          </Text>
          <Pressable
            accessibilityLabel="지도에서 장소 찾기"
            accessibilityRole="button"
            onPress={onOpenMap}
            style={styles.emptyButton}
          >
            <Text color={colors.text.inverse} variant="body-1">
              지도에서 장소 찾기
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SavedHeader subtitle={`저장 ${saved.places.length}곳 · 알림 받는 곳 ${notifiedCount}곳`} />
      <FlatList
        ItemSeparatorComponent={ListDivider}
        ListEmptyComponent={
          <Text color={colors.text.disabled} style={styles.filterEmpty} variant="body-3">
            {emptyFilterMessage(filter)}
          </Text>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <FilterChips onSelect={setFilter} options={SAVED_FILTERS} selected={filter} />
            {saved.actionErrorMessage !== null ? (
              <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
                {saved.actionErrorMessage}
              </Text>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.content}
        data={visible}
        keyExtractor={place => String(place.placeId)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel={`${item.name} 상세 보기`}
            accessibilityRole="button"
            disabled={onOpenPlace === undefined}
            onPress={() => onOpenPlace?.(item.placeId)}
          >
            <SavedPlaceCard
              isBusy={saved.busyPlaceIds.includes(item.placeId)}
              onToggleNotification={enabled => saved.toggleNotification(item.placeId, enabled)}
              onUnsave={() => saved.unsave(item.placeId)}
              place={toSavedPlaceCard(item)}
            />
          </Pressable>
        )}
      />
    </View>
  );
}

/**
 * 저장 탭 헤더.
 * 와이어프레임의 우측 상단 벨(저장 04 · 상태 변경 알림)은 알림 저장·발송이 아직 없어 두지 않았습니다.
 */
function SavedHeader({ subtitle }: { readonly subtitle: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text color={colors.text.primary} variant="title-1" weight="semibold">
        저장
      </Text>
      <Text color={colors.text.secondary} variant="body-3">
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  titleBlock: {
    gap: 6,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  header: {
    gap: 12,
    marginBottom: 6,
    marginTop: 18,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: HELP_SCREEN_X,
  },
  filterEmpty: {
    marginTop: 32,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: HELP_SCREEN_X,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
