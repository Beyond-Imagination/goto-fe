import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { formatDistance } from '@/help';
import { colors } from '@/styles/tokens/colors';

type PlaceSelectCardProps = {
  /** 시안의 왼쪽 순번. */
  readonly index: number;
  readonly placeName: string;
  readonly thumbnailUrl?: string | null;
  readonly distanceMeters: number | null;
  readonly address: string | null;
  readonly selected?: boolean;
  readonly onPress?: () => void;
  /** 연락처 화면은 펼침 화살표를, 장소 선택 화면은 이동 화살표를 씁니다. */
  readonly expanded?: boolean;
};

/** 번호 + 썸네일 + 장소명 + 거리 + 주소로 이뤄진 장소 카드. */
export function PlaceSelectCard({
  index,
  placeName,
  thumbnailUrl,
  distanceMeters,
  address,
  selected = false,
  onPress,
  expanded,
}: PlaceSelectCardProps) {
  return (
    <Pressable
      accessibilityLabel={placeName}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected ? styles.cardSelected : null]}
    >
      <Text color={colors.text.secondary} style={styles.index} variant="body-3" weight="semibold">
        {index}
      </Text>

      {/* 서버에 사진이 없는 장소는 빈 자리로 둡니다. */}
      <View style={styles.thumbnail}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
        ) : null}
      </View>

      <View style={styles.body}>
        <Text color={colors.text.primary} numberOfLines={1} variant="body-1" weight="semibold">
          {placeName}
        </Text>
        {distanceMeters === null ? null : (
          <Text color={colors.text.secondary} variant="body-3">
            현재 위치에서 {formatDistance(distanceMeters)}
          </Text>
        )}
        {address ? (
          <Text color={colors.text.disabled} numberOfLines={1} variant="caption-2">
            {address}
          </Text>
        ) : null}
      </View>

      <Text color={colors.icon.primary} variant="body-2">
        {expanded === undefined ? '›' : expanded ? '⌃' : '⌄'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cardSelected: {
    borderColor: colors.brand.mainAlt,
  },
  index: {
    minWidth: 15,
  },
  thumbnail: {
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: 4,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  body: {
    flex: 1,
    gap: 4,
  },
});
