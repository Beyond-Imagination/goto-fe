import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { StatusTag } from '@/components/myinfo/Tags';
import { Toggle } from '@/components/onboarding/Selectors';
import type { SavedPlaceCardData } from '@/saved';
import { colors } from '@/styles/tokens/colors';

type SavedPlaceCardProps = {
  readonly place: SavedPlaceCardData;
  /** 알림 스위치. 저장한 장소마다 따로 껐다 켤 수 있습니다. */
  readonly onToggleNotification: (enabled: boolean) => void;
  /** 하트 끄기 = 저장 해제. */
  readonly onUnsave: () => void;
  /** 요청이 끝나기 전에는 스위치·하트를 다시 누를 수 없게 합니다. */
  readonly isBusy?: boolean;
};

/** 저장 01 카드 — 장소 한 곳의 최신 상태와 알림 스위치. */
export function SavedPlaceCard({
  place,
  onToggleNotification,
  onUnsave,
  isBusy = false,
}: SavedPlaceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.body}>
        {place.thumbnailUrl ? (
          <Image source={{ uri: place.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Text color={colors.text.disabled} variant="caption-3">
              사진 없음
            </Text>
          </View>
        )}
        <View style={styles.text}>
          <Text color={colors.text.primary} numberOfLines={1} variant="body-1" weight="semibold">
            {place.name}
          </Text>
          {place.subtitle ? (
            <Text color={colors.text.secondary} numberOfLines={1} variant="body-3">
              {place.subtitle}
            </Text>
          ) : null}
          <Text color={colors.text.disabled} variant="caption-2">
            {place.lastCheckedLabel}
            {place.hasIndoorMap ? ' · 실내 지도 있음' : ''}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`${place.name} 저장 해제`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy, selected: true }}
          disabled={isBusy}
          hitSlop={10}
          onPress={onUnsave}
          style={styles.heart}
        >
          {/* 하트가 켜진 상태가 「저장됨」입니다. 누르면 저장이 풀립니다. */}
          <Text color={colors.brand.mainAlt} variant="title-2">
            ♥
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.tags}>
          <StatusTag label={place.statusLabel} tone={place.statusTone} />
          {place.isAvailable ? null : <StatusTag label="이용 정보 없음" tone="muted" />}
        </View>
        <View style={styles.notification}>
          <Text color={colors.text.secondary} variant="caption-1">
            변화 알림
          </Text>
          <Toggle
            label={`${place.name} 상태 변경 알림`}
            onValueChange={onToggleNotification}
            value={place.notificationEnabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    paddingVertical: 18,
  },
  body: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    backgroundColor: colors.neutral[200],
    borderRadius: 8,
    height: 72,
    overflow: 'hidden',
    width: 71,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 4,
  },
  heart: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tags: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
  },
  notification: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
