import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { Text as AppText } from "@/components";
import { Icon, type IconName } from "@/components/icons/Icon";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

import { ISSUE_TYPE_MARKER_COLOR } from "../obstacleSeverityStyle";

/** 화면 표시용으로 이미 가공된 최근 제보 한 건. 원본 ObstacleReportCluster/제보 API 응답을
 * 어떤 화면이 어떻게 매핑하든(가까운 줌 지도, 마이페이지 등) 이 컴포넌트는 신경 쓰지 않는다 —
 * 그래서 이 화면 전용 타입이 아니라 순수 표시용 필드만 받는다. */
export type RecentReportItem = {
  readonly category: string;
  readonly iconType: IconName;
  readonly locationText: string;
  readonly timeAgo: string;
  readonly thumbnailUrl: string | null;
};

const ICON_BOX_BACKGROUND_COLOR = colors.background.accentLight; // 아이콘 배지 배경(연한 주황)

export function RecentReportsList({ items }: { readonly items: readonly RecentReportItem[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        // thumbnailUrl을 key에 넣어, 목록이 갱신돼 같은 자리에 다른 제보가 오면 행이 새로
        // 마운트되어 이전 제보의 이미지 로드 실패 상태(imageFailed)가 남지 않게 한다.
        <RecentReportRow
          item={item}
          key={`${item.category}-${item.locationText}-${item.timeAgo}-${item.thumbnailUrl ?? ""}-${String(index)}`}
        />
      ))}
    </View>
  );
}

function RecentReportRow({ item }: { readonly item: RecentReportItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnailUrl = item.thumbnailUrl !== null && item.thumbnailUrl.trim() !== "" ? item.thumbnailUrl : null;
  const showThumbnail = thumbnailUrl !== null && !imageFailed;

  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Icon color={ISSUE_TYPE_MARKER_COLOR.high} name={item.iconType} size={20} />
      </View>

      <View style={styles.textGroup}>
        <AppText numberOfLines={1} style={styles.category} variant="body-2" weight="semibold">
          {item.category}
        </AppText>
        <View style={styles.metaRow}>
          <LocationPinGlyph />
          <AppText color={colors.text.secondary} numberOfLines={1} style={styles.metaText} variant="caption-1">
            {item.locationText}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <ClockGlyph />
          <AppText color={ISSUE_TYPE_MARKER_COLOR.high} numberOfLines={1} style={styles.metaText} variant="caption-1">
            {item.timeAgo}
          </AppText>
        </View>
      </View>

      <View style={styles.thumbnailBox}>
        {showThumbnail ? (
          <Image
            accessibilityLabel={`${item.category} 제보 사진`}
            onError={() => {
              setImageFailed(true);
            }}
            resizeMode="cover"
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnailImage}
          />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </View>
    </View>
  );
}

function ThumbnailPlaceholder() {
  return (
    <View accessibilityLabel="사진 없음" style={styles.thumbnailPlaceholder}>
      <Svg height={22} viewBox="0 0 24 24" width={22}>
        <Path
          d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
          fill="none"
          stroke={colors.neutral[400]}
          strokeWidth={1.5}
        />
        <Circle cx={9} cy={10} fill="none" r={1.6} stroke={colors.neutral[400]} strokeWidth={1.5} />
        <Path
          d="M5 17l4.5-4.5a1.5 1.5 0 0 1 2.12 0L15 15.9l1.4-1.4a1.5 1.5 0 0 1 2.12 0L21 17"
          fill="none"
          stroke={colors.neutral[400]}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

function LocationPinGlyph() {
  return (
    <Svg height={12} viewBox="0 0 24 24" width={12}>
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
        fill={colors.icon.secondary}
      />
    </Svg>
  );
}

function ClockGlyph() {
  return (
    <Svg height={12} viewBox="0 0 24 24" width={12}>
      <Circle cx={12} cy={12} fill="none" r={9} stroke={ISSUE_TYPE_MARKER_COLOR.high} strokeWidth={2} />
      <Path d="M12 7v5l3.5 3.5" fill="none" stroke={ISSUE_TYPE_MARKER_COLOR.high} strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  category: {
    marginBottom: spacing[1]
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: ICON_BOX_BACKGROUND_COLOR,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  list: {
    gap: spacing[4]
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1]
  },
  metaText: {
    flexShrink: 1
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  textGroup: {
    flex: 1
  },
  thumbnailBox: {
    height: 64,
    overflow: "hidden",
    width: 64
  },
  thumbnailImage: {
    borderRadius: radius.md,
    height: "100%",
    width: "100%"
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    height: "100%",
    justifyContent: "center",
    width: "100%"
  }
});
