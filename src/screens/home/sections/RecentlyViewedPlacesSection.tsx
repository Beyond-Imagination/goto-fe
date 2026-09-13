import { ImageBackground, ScrollView, StyleSheet, View } from "react-native";

import { Text as AppText } from "@/components";
import type { RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

import { homeSectionStyles } from "../homeSectionStyles";

export function RecentlyViewedPlacesSection({ places }: { readonly places: readonly RecentlyViewedPlace[] }) {
  if (places.length === 0) {
    return null;
  }

  return (
    <View style={homeSectionStyles.sections}>
      <AppText style={homeSectionStyles.sectionHeading} variant="title-2" weight="semibold">
        최근 조회한 장소
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.recentPlaceRow}>
          {places.map((place) => (
            <View key={place.placeId} style={styles.recentPlaceCard}>
              <ImageBackground
                imageStyle={styles.recentPlaceImage}
                source={place.thumbnailUrl ? { uri: place.thumbnailUrl } : undefined}
                style={[styles.recentPlaceImage, styles.recentPlaceImageWrapper]}
              />
              <AppText numberOfLines={1} style={styles.recentPlaceName} variant="caption-1" weight="semibold">
                {place.name}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  recentPlaceCard: {
    width: 108
  },
  recentPlaceImage: {
    borderRadius: radius.lg
  },
  recentPlaceImageWrapper: {
    aspectRatio: 1,
    backgroundColor: colors.background.regular
  },
  recentPlaceName: {
    marginTop: spacing[1]
  },
  recentPlaceRow: {
    flexDirection: "row",
    gap: spacing[3]
  }
});
