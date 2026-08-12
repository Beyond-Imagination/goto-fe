import { useCallback, useEffect, useRef, useState } from "react";

/* Reanimated SharedValues are intentionally mutated by UI-runtime worklets. */
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import {
  AccessibilityInfo,
  Dimensions,
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItem,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { shadows } from "@/styles/tokens/shadows";
import { spacing } from "@/styles/tokens/spacing";

import {
  bottomSheetSnap,
  bottomSheetSpring,
  isContentScrollEnabled,
  snapLabel,
  translateYFor,
  type BottomSheetSnap
} from "./bottomSheet.logic";
import { bottomSheetStyles as styles } from "./bottomSheet.styles";
import { useBottomSheetGesture } from "./hooks/useBottomSheetGesture";

export { bottomSheetSnap, type BottomSheetSnap } from "./bottomSheet.logic";

export type BottomSheetContent<Item> = {
  readonly contentKey: string;
  readonly data: readonly Item[];
  readonly keyExtractor: (item: Item, index: number) => string;
  readonly renderItem: ListRenderItem<Item>;
  readonly summary: string;
  readonly title: string;
};

type BottomSheetProps<Item> = {
  readonly content: BottomSheetContent<Item>;
  readonly initialSnap?: BottomSheetSnap;
  readonly onSnapChange?: (snap: BottomSheetSnap) => void;
  readonly snapRequestId?: number;
};

export function BottomSheet<Item>({
  content,
  initialSnap = bottomSheetSnap.peek,
  onSnapChange,
  snapRequestId = 0
}: BottomSheetProps<Item>) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const position = useSharedValue(Dimensions.get("window").height);
  const [containerHeight, setContainerHeight] = useState(height);
  const topSafeAreaInset = Math.max(0, insets.top - (height - containerHeight));
  const sheetHeight = Math.max(0, containerHeight - topSafeAreaInset);
  const currentSnap = useSharedValue<BottomSheetSnap>(initialSnap);
  const currentSnapRef = useRef<BottomSheetSnap>(initialSnap);
  const contentListRef = useRef<FlatList<Item>>(null);
  const isDragging = useSharedValue(false);
  const [snap, setSnap] = useState<BottomSheetSnap>(initialSnap);
  const [isSheetMounted, setIsSheetMounted] = useState(
    initialSnap !== bottomSheetSnap.collapsed
  );
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
    currentSnapRef.current = initialSnap;
    currentSnap.value = initialSnap;
    isDragging.value = false;
    setSnap(initialSnap);
    setIsSheetMounted(initialSnap !== bottomSheetSnap.collapsed);
    position.value = translateYFor(initialSnap, sheetHeight);
  }, [currentSnap, initialSnap, isDragging, position, sheetHeight, snapRequestId]);

  useEffect(() => {
    if (snap !== bottomSheetSnap.expanded) {
      contentListRef.current?.scrollToOffset({ animated: false, offset: 0 });
    }
  }, [snap]);

  useEffect(() => {
    contentListRef.current?.scrollToOffset({ animated: false, offset: 0 });
  }, [content.contentKey]);

  const onCollapseAnimationEnd = useCallback(() => {
    setIsSheetMounted(false);
  }, []);

  const syncSnap = useCallback(
    (nextSnap: BottomSheetSnap) => {
      if (nextSnap !== bottomSheetSnap.collapsed) {
        setIsSheetMounted(true);
      }

      currentSnapRef.current = nextSnap;
      currentSnap.value = nextSnap;
      setSnap(nextSnap);
      onSnapChange?.(nextSnap);
    },
    [currentSnap, onSnapChange]
  );

  const snapTo = useCallback(
    (nextSnap: BottomSheetSnap) => {
      const target = translateYFor(nextSnap, sheetHeight);

      syncSnap(nextSnap);

      if (reduceMotion) {
        position.value = target;
        if (nextSnap === bottomSheetSnap.collapsed) {
          onCollapseAnimationEnd();
        }
        return;
      }

      position.value = withSpring(target, bottomSheetSpring, (finished) => {
        if (finished && nextSnap === bottomSheetSnap.collapsed) {
          scheduleOnRN(onCollapseAnimationEnd);
        }
      });
    },
    [onCollapseAnimationEnd, position, reduceMotion, sheetHeight, syncSnap]
  );

  const toggleSnap = useCallback(() => {
    snapTo(
      currentSnapRef.current === bottomSheetSnap.peek
        ? bottomSheetSnap.expanded
        : bottomSheetSnap.peek
    );
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

  const snapIndex =
    snap === bottomSheetSnap.collapsed ? 0 : snap === bottomSheetSnap.peek ? 1 : 2;
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    if (nextHeight > 0) {
      setContainerHeight(nextHeight);
    }
  }, []);
  const handleControl = (
    <Pressable
      accessibilityActions={[{ name: "increment", label: "확장" }, { name: "decrement", label: "축소" }]}
      accessibilityHint="위로 끌어 확장하고, 아래로 끌어 축소하거나 닫습니다."
      accessibilityLabel="탐색 패널 크기 조절"
      accessibilityRole="adjustable"
      accessibilityValue={{ max: 2, min: 0, now: snapIndex, text: snapLabel(snap) }}
      aria-valuemax={2}
      aria-valuemin={0}
      aria-valuenow={snapIndex}
      aria-valuetext={snapLabel(snap)}
      hitSlop={spacing[3]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "increment") {
          snapTo(bottomSheetSnap.expanded);
          return;
        }

        snapTo(snap === bottomSheetSnap.expanded ? bottomSheetSnap.peek : bottomSheetSnap.collapsed);
      }}
      onPress={handlePress}
      style={styles.handleButton}
    >
      <View style={styles.handle} />
    </Pressable>
  );

  return (
    <View onLayout={handleContainerLayout} pointerEvents="box-none" style={styles.overlay}>
      {isSheetMounted ? (
        <Animated.View
          aria-hidden={snap === bottomSheetSnap.collapsed}
          accessibilityElementsHidden={snap === bottomSheetSnap.collapsed}
          importantForAccessibility={
            snap === bottomSheetSnap.collapsed ? "no-hide-descendants" : "auto"
          }
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
            <View {...(pointerHandlers ?? {})} style={styles.handleGestureArea}>
              {Platform.OS === "web" ? (
                handleControl
              ) : (
                <GestureDetector gesture={nativeGesture}>
                  {handleControl}
                </GestureDetector>
              )}
            </View>
          </View>

          <FlatList
            bounces={false}
            contentContainerStyle={styles.content}
            data={content.data}
            keyExtractor={content.keyExtractor}
            ListHeaderComponent={
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{content.title}</Text>
                <Text style={styles.summary}>{content.summary}</Text>
              </View>
            }
            ref={contentListRef}
            renderItem={content.renderItem}
            scrollEnabled={isContentScrollEnabled(snap)}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
