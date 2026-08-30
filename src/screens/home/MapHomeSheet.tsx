import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* Reanimated SharedValues are intentionally mutated by UI-runtime worklets. */
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import {
  AccessibilityInfo,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shadows } from "@/styles/tokens/shadows";
import { spacing } from "@/styles/tokens/spacing";

import {
  bottomSheetSnap,
  bottomSheetSpring,
  isContentScrollEnabled,
  snapLabel,
  translateYFor,
  type BottomSheetSnap
} from "@/components/common/bottomSheet/bottomSheet.logic";
import { bottomSheetStyles as styles } from "@/components/common/bottomSheet/bottomSheet.styles";
import { useBottomSheetGesture } from "@/components/common/bottomSheet/hooks/useBottomSheetGesture";

/**
 * 홈 지도 줌 구간 전용 바텀시트. 기존 `BottomSheet<Item>`은 `FlatList`
 * render-item 패턴이라 카드/도넛차트 같은 임의 콘텐츠를 담기 어려워, 같은 드래그/스냅
 * 로직(bottomSheet.logic, useBottomSheetGesture)만 재사용하고 콘텐츠 영역은
 * `ScrollView` + children으로 바꿨다.
 */
const webGestureStyle = Platform.select({
  web: {
    touchAction: "none",
    userSelect: "none"
  } as unknown as ViewStyle,
  default: undefined
});

type MapHomeSheetProps = {
  readonly children: ReactNode;
  readonly contentKey: string;
  readonly title: string;
};

export function MapHomeSheet({ children, contentKey, title }: MapHomeSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const position = useSharedValue(Dimensions.get("window").height);
  const [containerHeight, setContainerHeight] = useState(height);
  const topSafeAreaInset = Math.max(0, insets.top - (height - containerHeight));
  const sheetHeight = Math.max(0, containerHeight - topSafeAreaInset);
  const currentSnap = useSharedValue<BottomSheetSnap>(bottomSheetSnap.peek);
  const currentSnapRef = useRef<BottomSheetSnap>(bottomSheetSnap.peek);
  const scrollRef = useRef<ScrollView>(null);
  const isDragging = useSharedValue(false);
  const [snap, setSnap] = useState<BottomSheetSnap>(bottomSheetSnap.peek);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setContainerHeight(height);
  }, [height]);

  useEffect(() => {
    position.value = translateYFor(bottomSheetSnap.peek, sheetHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sheetHeight만 반영, 마운트 시 1회 위치 계산
  }, [sheetHeight]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [contentKey]);

  const syncSnap = useCallback((nextSnap: BottomSheetSnap) => {
    currentSnapRef.current = nextSnap;
    currentSnap.value = nextSnap;
    setSnap(nextSnap);
  }, [currentSnap]);

  const snapTo = useCallback(
    (nextSnap: BottomSheetSnap) => {
      const target = translateYFor(nextSnap, sheetHeight);

      syncSnap(nextSnap);

      if (reduceMotion) {
        position.value = target;
        return;
      }

      position.value = withSpring(target, bottomSheetSpring);
    },
    [position, reduceMotion, sheetHeight, syncSnap]
  );

  // 홈 지도 시트는 항상 최소 peek 상태로 유지 — 완전히 접히지 않는다.
  const onCollapseAnimationEnd = useCallback(() => {
    snapTo(bottomSheetSnap.peek);
  }, [snapTo]);

  const toggleSnap = useCallback(() => {
    snapTo(currentSnapRef.current === bottomSheetSnap.peek ? bottomSheetSnap.expanded : bottomSheetSnap.peek);
  }, [snapTo]);

  const { handlePress, nativeGesture, pointerHandlers } = useBottomSheetGesture({
    currentSnap,
    currentSnapRef,
    height: sheetHeight,
    isDragging,
    onCollapseAnimationEnd,
    position,
    reduceMotion,
    snapTo,
    syncSnap,
    toggleSnap
  });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    elevation: isDragging.value ? 0 : shadows.lg.elevation,
    shadowOpacity: isDragging.value ? 0 : shadows.lg.shadowOpacity,
    transform: [{ translateY: position.value }]
  }));

  const handleContainerLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setContainerHeight(nextHeight);
    }
  }, []);

  const handleControl = (
    <Pressable
      accessibilityActions={[{ name: "increment", label: "확장" }, { name: "decrement", label: "축소" }]}
      accessibilityHint="위로 끌어 확장하고, 아래로 끌어 축소합니다."
      accessibilityLabel="지도 정보 패널 크기 조절"
      accessibilityRole="adjustable"
      accessibilityValue={{ max: 1, min: 0, now: snap === bottomSheetSnap.expanded ? 1 : 0, text: snapLabel(snap) }}
      hitSlop={spacing[3]}
      onAccessibilityAction={(event) => {
        snapTo(event.nativeEvent.actionName === "increment" ? bottomSheetSnap.expanded : bottomSheetSnap.peek);
      }}
      onPress={handlePress}
      style={styles.handleButton}
    >
      <View style={styles.handle} />
    </Pressable>
  );

  return (
    <View onLayout={handleContainerLayout} pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            paddingBottom: insets.bottom + spacing[5]
          },
          animatedSheetStyle
        ]}
      >
        <View style={styles.handleArea}>
          <View {...(pointerHandlers ?? {})} style={[styles.handleGestureArea, webGestureStyle]}>
            {Platform.OS === "web" ? (
              handleControl
            ) : (
              <GestureDetector gesture={nativeGesture}>{handleControl}</GestureDetector>
            )}
          </View>
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          ref={scrollRef}
          scrollEnabled={isContentScrollEnabled(snap)}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
