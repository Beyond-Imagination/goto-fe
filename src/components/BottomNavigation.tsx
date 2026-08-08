import { useWindowDimensions } from "react-native";
import { Image, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";

import { FIGMA_NAVIGATION_ASSETS } from '@/design/figmaNavigationAssets';
import { APP_ROUTE, type AppRoute, type NavigationTabId } from '@/navigation/routes';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily, fontSize } from '@/styles/tokens/typography';

const NAVIGATION_LAYOUT = {
  actionAssetSize: 94,
  height: 90,
  referenceWidth: 390,
  tabRowReferenceWidth: 375,
} as const;

export const NAVIGATION_TABS = [
  { id: "home", label: "홈" },
  { id: "report", label: "제보" },
  { id: "saved", label: "저장" },
  { id: "profile", label: "내 정보" }
] as const satisfies readonly { readonly id: NavigationTabId; readonly label: string }[];

type NavigationTab = (typeof NAVIGATION_TABS)[number];

type BottomNavigationProps = {
  readonly activeScreen: AppRoute;
  readonly onNavigate: (route: AppRoute) => void;
};

type TabButtonProps = {
  readonly activeScreen: AppRoute;
  readonly item: NavigationTab;
  readonly onNavigate: (route: AppRoute) => void;
};

type FigmaSvgProps = {
  readonly height: number;
  readonly source: string;
  readonly width: number;
};

export function BottomNavigation({
  activeScreen,
  onNavigate
}: BottomNavigationProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigationHeight = Math.max(
    NAVIGATION_LAYOUT.height,
    spacing[14] + insets.bottom
  );
  const tabRowWidth = (width * NAVIGATION_LAYOUT.tabRowReferenceWidth) / NAVIGATION_LAYOUT.referenceWidth;
  const actionLeft = (width - NAVIGATION_LAYOUT.actionAssetSize) / 2;
  const locationLeft = (width - spacing[12]) / 2;
  const tabRowLeft = (width - tabRowWidth) / 2;

  return (
    <View role="navigation" style={[styles.navigation, { height: navigationHeight }]}>
      <View style={styles.background}>
        <FigmaSvg
          height={NAVIGATION_LAYOUT.height}
          source={FIGMA_NAVIGATION_ASSETS.background}
          width={width}
        />
      </View>

      {insets.bottom > 0 ? (
        <View style={[styles.safeAreaFill, { height: insets.bottom }]} />
      ) : null}

      <View accessibilityRole="tablist" style={[styles.tabRow, { left: tabRowLeft, width: tabRowWidth }]}>
        {NAVIGATION_TABS.slice(0, 2).map((item) => (
          <TabButton
            activeScreen={activeScreen}
            item={item}
            key={item.id}
            onNavigate={onNavigate}
          />
        ))}

        <View style={styles.actionSlot} />

        {NAVIGATION_TABS.slice(2).map((item) => (
          <TabButton
            activeScreen={activeScreen}
            item={item}
            key={item.id}
            onNavigate={onNavigate}
          />
        ))}
      </View>

      <View style={[styles.locationAction, { left: actionLeft }]}>
        <FigmaSvg
          height={NAVIGATION_LAYOUT.actionAssetSize}
          source={FIGMA_NAVIGATION_ASSETS.locationAction}
          width={NAVIGATION_LAYOUT.actionAssetSize}
        />
      </View>

      <Pressable
        accessibilityLabel="위치 화면으로 이동"
        accessibilityRole="button"
        accessibilityState={{ selected: activeScreen === APP_ROUTE.location }}
        onPress={() => onNavigate(APP_ROUTE.location)}
        style={({ pressed }) => [styles.locationTab, { left: locationLeft }, pressed ? styles.pressed : null]}
      >
        <FigmaSvg height={30} source={FIGMA_NAVIGATION_ASSETS.location} width={30} />
      </Pressable>
    </View>
  );
}

function TabButton({ activeScreen, item, onNavigate }: TabButtonProps) {
  const isSelected = activeScreen === item.id;

  return (
    <Pressable
      accessibilityLabel={`${item.label} 화면으로 이동`}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onNavigate(item.id)}
      style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}
    >
      <TabIcon id={item.id} isSelected={isSelected} />
      <Text style={[styles.tabLabel, isSelected ? styles.tabLabelSelected : null]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function TabIcon({ id, isSelected }: Pick<NavigationTab, "id"> & { readonly isSelected: boolean }) {
  switch (id) {
    case "home":
      return (
        <View style={styles.iconBox}>
          <AssetLayer height={8.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.homeSquare : FIGMA_NAVIGATION_ASSETS.homeSquareStroke} style={styles.homeTopLeft} width={8.5} />
          <AssetLayer height={8.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.homeSquare : FIGMA_NAVIGATION_ASSETS.homeSquareStroke} style={styles.homeTopRight} width={8.5} />
          <AssetLayer height={8.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.homeSquare : FIGMA_NAVIGATION_ASSETS.homeSquareStroke} style={styles.homeBottomLeft} width={8.5} />
          <AssetLayer height={8.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.homeSquare : FIGMA_NAVIGATION_ASSETS.homeSquareStroke} style={styles.homeBottomRight} width={8.5} />
        </View>
      );
    case "report":
      return (
        <View style={styles.iconBox}>
          <AssetLayer height={19.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.reportDocumentFilled : FIGMA_NAVIGATION_ASSETS.reportDocument} style={styles.reportDocument} width={19.5} />
          <AssetLayer height={15.8136} source={isSelected ? FIGMA_NAVIGATION_ASSETS.reportPencilFilled : FIGMA_NAVIGATION_ASSETS.reportPencil} style={styles.reportPencil} width={15.8135} />
        </View>
      );
    case "saved":
      return (
        <View style={styles.iconBox}>
          <AssetLayer height={16.2225} source={isSelected ? FIGMA_NAVIGATION_ASSETS.savedFilled : FIGMA_NAVIGATION_ASSETS.saved} style={styles.savedIcon} width={19.7356} />
        </View>
      );
    case "profile":
      return (
        <View style={styles.iconBox}>
          <AssetLayer height={8.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.profileHeadFilled : FIGMA_NAVIGATION_ASSETS.profileHead} style={styles.profileHead} width={8.5} />
          <AssetLayer height={8.5} source={isSelected ? FIGMA_NAVIGATION_ASSETS.profileBodyFilled : FIGMA_NAVIGATION_ASSETS.profileBody} style={styles.profileBody} width={19.5} />
        </View>
      );
  }
}

type AssetLayerProps = {
  readonly height: number;
  readonly source: string;
  readonly style: StyleProp<ViewStyle>;
  readonly width: number;
};

function AssetLayer({ height, source, style, width }: AssetLayerProps) {
  return (
    <View style={[styles.iconLayer, style]}>
      <FigmaSvg height={height} source={source} width={width} />
    </View>
  );
}

function FigmaSvg({ height, source, width }: FigmaSvgProps) {
  if (Platform.OS === "web") {
    return (
      <Image
        resizeMode="stretch"
        source={{ uri: source }}
        style={{ height, width }}
      />
    );
  }

  return <SvgUri height={height} uri={source} width={width} />;
}

const styles = StyleSheet.create({
  navigation: {
    overflow: "visible",
    position: "relative",
  },
  background: {
    left: 0,
    pointerEvents: "none",
    position: "absolute",
  },
  safeAreaFill: {
    backgroundColor: colors.background.primary,
    bottom: 0,
    left: 0,
    pointerEvents: "none",
    position: "absolute",
    right: 0
  },
  tabRow: {
    flexDirection: "row",
    height: spacing[14],
    position: "absolute",
    top: 0
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: spacing[1],
    justifyContent: "center",
    paddingBottom: spacing[1],
    paddingTop: spacing[2]
  },
  actionSlot: {
    flex: 1
  },
  iconBox: {
    height: spacing[6],
    position: "relative",
    width: spacing[6]
  },
  iconLayer: {
    position: "absolute"
  },
  homeTopLeft: {
    left: 2.25,
    top: 2.25
  },
  homeTopRight: {
    left: 13.25,
    top: 2.25
  },
  homeBottomLeft: {
    left: 2.25,
    top: 13.25
  },
  homeBottomRight: {
    left: 13.25,
    top: 13.25
  },
  reportDocument: {
    left: 2.25,
    top: 2.25
  },
  reportPencil: {
    left: 7.69,
    top: 2
  },
  savedIcon: {
    left: 2.13,
    top: 5.27
  },
  profileHead: {
    left: 7.75,
    top: 2.25
  },
  profileBody: {
    left: 2.25,
    top: 13.75
  },
  locationAction: {
    height: NAVIGATION_LAYOUT.actionAssetSize,
    pointerEvents: "none",
    position: "absolute",
    top: -40,
    width: NAVIGATION_LAYOUT.actionAssetSize
  },
  locationTab: {
    alignItems: "center",
    height: spacing[12],
    justifyContent: "center",
    position: "absolute",
    top: -27,
    width: spacing[12]
  },
  tabLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize['caption-3'].fontSize,
    letterSpacing: -0.275,
    lineHeight: fontSize['caption-3'].lineHeight,
    textAlign: "center"
  },
  tabLabelSelected: {
    color: colors.text.primary,
    fontFamily: fontFamily.semibold
  },
  pressed: {
    opacity: 0.7
  }
});
