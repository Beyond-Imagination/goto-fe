import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { fontFamily } from '@/styles/tokens/typography';

const DOT_SIZE = 10;
const DOT_PILL = 34;
/** 스와이프 중간에 양쪽 점이 함께 늘어나 이어지는 것처럼 보이게 하는 중간값. */
const DOT_STRETCH = 26;

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          {/* 시스템 폰트에 맡기면 안드로이드에서 글리프가 작게 나와서 번들 폰트로 고정합니다. */}
          <Text color={colors.icon.primary} style={styles.backIcon} variant="headline-1">
            ←
          </Text>
        </Pressable>
      ) : null}
      <Text color={colors.text.primary} variant="title-2" weight="semibold">
        {title}
      </Text>
    </View>
  );
}

/** 프로필 설정 3단계의 진행 상태 바. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const ratio = Math.max(0, Math.min(1, step / total));

  return (
    <View
      accessibilityLabel={`전체 ${total}단계 중 ${step}단계`}
      accessibilityRole="progressbar"
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

interface PageDotsProps {
  count: number;
  index: number;
  /** 현재 페이지 위치(0, 1, 2...). 스크롤에 물려 있어 스와이프 중에도 연속으로 움직입니다. */
  progress: Animated.AnimatedInterpolation<number>;
}

/**
 * 온보딩 페이지 인디케이터.
 * 손가락을 따라 알약이 늘어났다 줄어들고, 페이지가 확정되면 살짝 튕기며 자리를 잡습니다.
 */
export function PageDots({ count, index, progress }: PageDotsProps) {
  const [pop] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.9, duration: 90, useNativeDriver: false }),
      Animated.spring(pop, {
        friction: 3.5,
        tension: 180,
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
  }, [index, pop]);

  return (
    <Animated.View style={[styles.dots, { transform: [{ scale: pop }] }]}>
      {Array.from({ length: count }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: progress.interpolate({
                extrapolate: 'clamp',
                inputRange: [i - 1, i, i + 1],
                outputRange: [colors.border.regular, colors.brand.mainAlt, colors.border.regular],
              }),
              width: progress.interpolate({
                extrapolate: 'clamp',
                inputRange: [i - 1, i - 0.5, i, i + 0.5, i + 1],
                outputRange: [DOT_SIZE, DOT_STRETCH, DOT_PILL, DOT_STRETCH, DOT_SIZE],
              }),
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  back: {
    left: SCREEN_X,
    position: 'absolute',
    zIndex: 1,
  },
  backIcon: {
    fontFamily: fontFamily.regular,
    lineHeight: 34,
  },
  track: {
    backgroundColor: colors.border.light,
    borderRadius: 2,
    height: 3,
    marginHorizontal: SCREEN_X,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.brand.mainAlt,
    height: '100%',
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    borderRadius: DOT_SIZE / 2,
    height: DOT_SIZE,
  },
});
