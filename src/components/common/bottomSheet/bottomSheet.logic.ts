export const bottomSheetSnap = {
  collapsed: "collapsed",
  expanded: "expanded",
  peek: "peek"
} as const;

export type BottomSheetSnap = (typeof bottomSheetSnap)[keyof typeof bottomSheetSnap];

export const dragStartThreshold = 8;
export const expandedTriggerRatio = 0.55;
export const flingVelocity = 0.8;
export const bottomSheetSpring = {
  damping: 34,
  mass: 0.75,
  overshootClamping: true,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
  stiffness: 340
} as const;

const collapsedTriggerRatio = 0.15;
const peekRatio = 0.33;

export function translateYFor(snap: BottomSheetSnap, height: number): number {
  "worklet";

  if (snap === bottomSheetSnap.collapsed) {
    return height;
  }

  return snap === bottomSheetSnap.peek ? height * (1 - peekRatio) : 0;
}

export function clamp(value: number, lower: number, upper: number): number {
  "worklet";

  return Math.min(Math.max(value, lower), upper);
}

export function nativeVelocityForSnap(velocityY: number): number {
  "worklet";

  return velocityY / 1000;
}

export function isContentScrollEnabled(snap: BottomSheetSnap): boolean {
  return snap === bottomSheetSnap.expanded;
}

export function selectSnap(
  startSnap: BottomSheetSnap,
  height: number,
  translateY: number,
  velocityY: number
): BottomSheetSnap {
  "worklet";

  const visibleRatio = 1 - translateY / height;

  if (velocityY <= -flingVelocity) {
    return bottomSheetSnap.expanded;
  }

  if (velocityY >= flingVelocity) {
    return startSnap === bottomSheetSnap.expanded
      ? bottomSheetSnap.peek
      : bottomSheetSnap.collapsed;
  }

  if (startSnap === bottomSheetSnap.expanded && translateY > 0) {
    return bottomSheetSnap.peek;
  }

  if (visibleRatio >= expandedTriggerRatio) {
    return bottomSheetSnap.expanded;
  }

  if (startSnap === bottomSheetSnap.peek && visibleRatio <= collapsedTriggerRatio) {
    return bottomSheetSnap.collapsed;
  }

  return bottomSheetSnap.peek;
}

export function snapLabel(snap: BottomSheetSnap): string {
  if (snap === bottomSheetSnap.collapsed) {
    return "닫힘";
  }

  return snap === bottomSheetSnap.expanded ? "확장됨" : "33% 열림";
}
