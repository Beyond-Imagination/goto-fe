import { useCallback, useMemo, useRef, type RefObject } from "react";

/* Reanimated SharedValues are intentionally mutable and stable across renders. */
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
import { Platform, type PointerEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  bottomSheetSnap,
  bottomSheetSpring,
  clamp,
  dragStartThreshold,
  nativeVelocityForSnap,
  selectSnap,
  translateYFor,
  type BottomSheetSnap
} from "../bottomSheet.logic";

type UseBottomSheetGestureOptions = {
  readonly currentSnap: SharedValue<BottomSheetSnap>;
  readonly currentSnapRef: RefObject<BottomSheetSnap>;
  readonly height: number;
  readonly isDragging: SharedValue<boolean>;
  readonly onCollapseAnimationEnd: () => void;
  readonly position: SharedValue<number>;
  readonly reduceMotion: boolean;
  readonly snapTo: (snap: BottomSheetSnap) => void;
  readonly syncSnap: (snap: BottomSheetSnap) => void;
  readonly toggleSnap: () => void;
};

type PointerCaptureTarget = {
  releasePointerCapture?: (pointerId: number) => void;
  setPointerCapture?: (pointerId: number) => void;
};

function isPointerCaptureTarget(target: unknown): target is PointerCaptureTarget {
  return (
    typeof target === "object" &&
    target !== null &&
    ("setPointerCapture" in target || "releasePointerCapture" in target)
  );
}

export function useBottomSheetGesture({
  currentSnap,
  currentSnapRef,
  height,
  isDragging,
  onCollapseAnimationEnd,
  position,
  reduceMotion,
  snapTo,
  syncSnap,
  toggleSnap
}: UseBottomSheetGestureOptions) {
  const hasDraggedRef = useRef(false);
  const nativeDragStart = useSharedValue(0);
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartYRef = useRef(0);
  const suppressNextPressRef = useRef(false);

  const clearPressSuppression = useCallback(() => {
    setTimeout(() => {
      suppressNextPressRef.current = false;
    }, 0);
  }, []);

  const finishWebDrag = useCallback(
    (deltaY: number, velocityY: number) => {
      suppressNextPressRef.current = true;
      clearPressSuppression();
      isDragging.value = false;

      if (!hasDraggedRef.current) {
        toggleSnap();
        return;
      }

      hasDraggedRef.current = false;
      snapTo(
        selectSnap(
          currentSnapRef.current,
          height,
          clamp(nativeDragStart.value + deltaY, 0, height),
          velocityY
        )
      );
    },
    [clearPressSuppression, currentSnapRef, height, isDragging, snapTo, toggleSnap]
  );

  const nativeGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(dragStartThreshold)
        .onStart(() => {
          nativeDragStart.value = position.value;
          cancelAnimation(position);
          isDragging.value = true;
        })
        .onUpdate((event) => {
          position.value = clamp(nativeDragStart.value + event.translationY, 0, height);
        })
        .onEnd((event) => {
          const nextSnap = selectSnap(
            currentSnap.value,
            height,
            clamp(nativeDragStart.value + event.translationY, 0, height),
            nativeVelocityForSnap(event.velocityY)
          );
          const target = translateYFor(nextSnap, height);

          currentSnap.value = nextSnap;
          isDragging.value = false;
          scheduleOnRN(syncSnap, nextSnap);

          if (reduceMotion) {
            position.value = target;
            if (nextSnap === bottomSheetSnap.collapsed) {
              scheduleOnRN(onCollapseAnimationEnd);
            }
            return;
          }

          position.value = withSpring(target, bottomSheetSpring, (finished) => {
            if (finished && nextSnap === bottomSheetSnap.collapsed) {
              scheduleOnRN(onCollapseAnimationEnd);
            }
          });
        })
        .onFinalize((_event, success) => {
          isDragging.value = false;

          if (!success) {
            const target = translateYFor(currentSnap.value, height);
            position.value = reduceMotion
              ? target
              : withSpring(target, bottomSheetSpring);
          }
        }),
    [
      currentSnap,
      height,
      isDragging,
      nativeDragStart,
      onCollapseAnimationEnd,
      position,
      reduceMotion,
      syncSnap
    ]
  );

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (Platform.OS !== "web" || !event.nativeEvent.isPrimary) {
        return;
      }

      pointerIdRef.current = event.nativeEvent.pointerId;
      pointerStartYRef.current = event.nativeEvent.clientY;
      hasDraggedRef.current = false;
      cancelAnimation(position);
      nativeDragStart.value = position.value;
      if (isPointerCaptureTarget(event.currentTarget)) {
        event.currentTarget.setPointerCapture?.(event.nativeEvent.pointerId);
      }
    },
    [nativeDragStart, position]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== event.nativeEvent.pointerId) {
        return;
      }

      const deltaY = event.nativeEvent.clientY - pointerStartYRef.current;
      hasDraggedRef.current = Math.abs(deltaY) > dragStartThreshold;
      isDragging.value = hasDraggedRef.current;
      position.value = clamp(nativeDragStart.value + deltaY, 0, height);
    },
    [height, isDragging, nativeDragStart, position]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== event.nativeEvent.pointerId) {
        return;
      }

      pointerIdRef.current = null;
      if (isPointerCaptureTarget(event.currentTarget)) {
        event.currentTarget.releasePointerCapture?.(event.nativeEvent.pointerId);
      }
      finishWebDrag(event.nativeEvent.clientY - pointerStartYRef.current, 0);
    },
    [finishWebDrag]
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== event.nativeEvent.pointerId) {
        return;
      }

      pointerIdRef.current = null;
      hasDraggedRef.current = false;
      suppressNextPressRef.current = true;
      clearPressSuppression();
      isDragging.value = false;
      snapTo(currentSnapRef.current);
    },
    [clearPressSuppression, currentSnapRef, isDragging, snapTo]
  );

  const handlePress = useCallback(() => {
    if (suppressNextPressRef.current || hasDraggedRef.current) {
      return;
    }

    toggleSnap();
  }, [toggleSnap]);

  return {
    handlePress,
    nativeGesture,
    pointerHandlers:
      Platform.OS === "web"
        ? { onPointerCancel, onPointerDown, onPointerMove, onPointerUp }
        : undefined
  };
}
