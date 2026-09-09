import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { ReportThumbnail } from '@/components/myinfo/ReportThumbnail';
import { CategoryTag, StatusTag } from '@/components/myinfo/Tags';
import type { StatusTagToneName } from '@/components/myinfo/tokens';
import { colors } from '@/styles/tokens/colors';

export type ReportStatusTag = {
  readonly label: string;
  readonly tone: StatusTagToneName;
};

export type ReportListItemData = {
  readonly id: string;
  /** 상세 화면이 다르므로 어떤 제보인지 함께 들고 다닙니다. */
  readonly kind: 'obstacle' | 'place' | 'facility';
  readonly category: '시설' | '장소' | '장애물';
  readonly title: string;
  readonly address: string;
  /** 썸네일 지도에 찍을 제보 위치. */
  readonly latitude: number;
  readonly longitude: number;
  /** 첨부 사진이 있으면 지도 대신 사진을 보여줍니다. */
  readonly photoUrl?: string | null;
  /** «2024.05.12 · 제보 ID 1247» 형태의 보조 정보 줄. */
  readonly meta: string;
  readonly tags: readonly ReportStatusTag[];
};

type ReportListItemProps = {
  readonly report: ReportListItemData;
  readonly onPress?: () => void;
};

/** 내 제보 기록 · 내가 확인한 리포트의 공용 리스트 아이템. */
export function ReportListItem({ report, onPress }: ReportListItemProps) {
  return (
    <Pressable
      accessibilityLabel={`${report.title} 상세 보기`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.item}
    >
      <View style={styles.body}>
        <View>
          <ReportThumbnail photoUrl={report.photoUrl} />
          <View style={styles.categoryTag}>
            <CategoryTag label={report.category} />
          </View>
        </View>
        <View style={styles.text}>
          <Text color={colors.text.primary} numberOfLines={1} variant="body-1" weight="semibold">
            {report.title}
          </Text>
          <View style={styles.addressRow}>
            <Image source={require('../../assets/icons/pin-small.png')} style={styles.pin} />
            <Text color={colors.text.secondary} numberOfLines={1} style={styles.address} variant="body-3">
              {report.address}
            </Text>
          </View>
          <Text color={colors.text.disabled} variant="caption-2">
            {report.meta}
          </Text>
        </View>
        <Image source={require('../../assets/icons/chevron-right.png')} style={styles.chevron} />
      </View>
      {report.tags.length > 0 ? (
        <View style={styles.tags}>
          {report.tags.map(tag => (
            <StatusTag key={tag.label} label={tag.label} tone={tag.tone} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: 8,
  },
  body: {
    flexDirection: 'row',
    gap: 14,
  },
  thumb: {
    height: 72,
    width: 71,
  },
  categoryTag: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  addressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  pin: {
    height: 15,
    width: 15,
  },
  address: {
    flex: 1,
  },
  chevron: {
    height: 20,
    marginTop: 3,
    width: 20,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
    // 태그 줄은 썸네일 폭만큼 들여 써서 본문 텍스트와 정렬을 맞춥니다.
    marginLeft: 85,
  },
});
