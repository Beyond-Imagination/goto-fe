import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { PageDots } from '@/components/onboarding/ScreenHeader';
import { BOTTOM_GAP_NO_LINK, SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

/** 일러스트 영역이 차지하는 화면 높이 비율. 이 아래로 제목과 본문이 이어집니다. */
const ILLUSTRATION_BAND = 0.6;

/**
 * 시안과 맞추기 위한 일러스트 하향 오프셋(화면 높이 비율).
 * 두 번째 페이지의 궤적이 다이나믹 아일랜드에 닿지 않을 만큼은 확보해야 합니다.
 */
const ILLUSTRATION_NUDGE = 0.035;

interface Page {
  illustration: ImageSourcePropType;
  title: string;
  body: string;
  /**
   * 시안의 세로 배치를 화면 높이 비율로 옮긴 값입니다.
   * top이 음수면 일러스트가 화면 위로 빠져나가며 잘립니다.
   */
  top: number;
  height: number;
  /**
   * 좌우 오프셋(일러스트 폭 비율, 음수면 왼쪽).
   * 에셋 안에서 주체가 한쪽으로 몰려 있는 경우를 보정합니다.
   */
  shiftX?: number;
}

const PAGES: Page[] = [
  {
    illustration: require('../assets/onboarding-travel.png'),
    title: '어디든 안심하고 떠나세요',
    body: '접근 가능한 관광지와 이동 정보를 한눈에\n확인하고, 나에게 맞는 여행을 계획해 보세요.',
    top: 0.2,
    height: 0.37,
  },
  {
    illustration: require('../assets/onboarding-trust.png'),
    title: '믿을 수 있는 정보',
    body: '공식 정보와 사용자 제보를 함께 제공하여\n지금 방문 가능한지 정확히 판단할 수 있어요.',
    // 파란 궤적이 화면 위로 빠져나가는 시안의 연출.
    top: -0.03,
    height: 0.59,
    // 인물과 말풍선이 캔버스 중앙보다 오른쪽(+7.3%)에 몰려 있어 왼쪽으로 당깁니다.
    shiftX: -0.04,
  },
  {
    illustration: require('../assets/onboarding-together.png'),
    title: '함께라서 더 안전하게',
    body: '당신의 제보가 다음 여행자의 길이 됩니다.',
    top: 0.11,
    height: 0.46,
  },
];

/** 에셋의 원본 비율(가로/세로). */
function aspectRatioOf(source: ImageSourcePropType): number {
  const resolved = Image.resolveAssetSource(source);

  return resolved?.width && resolved?.height ? resolved.width / resolved.height : 1;
}

interface OnboardingScreenProps {
  onStart: () => void;
  /** 딥링크로 특정 페이지부터 열 때 사용합니다. */
  initialPage?: number;
}

export function OnboardingScreen({ onStart, initialPage = 0 }: OnboardingScreenProps) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialPage);
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX] = useState(() => new Animated.Value(initialPage * width));

  // 인디케이터가 손가락을 그대로 따라오도록 스크롤 오프셋을 페이지 단위로 환산합니다.
  const progress = useMemo(() => Animated.divide(scrollX, width), [scrollX, width]);

  // 딥링크로 페이지가 바뀌면 렌더 중에 인디케이터 상태를 맞춥니다.
  // (React 권장 "prop이 바뀔 때 state 조정" 패턴)
  const [syncedPage, setSyncedPage] = useState(initialPage);

  if (syncedPage !== initialPage) {
    setSyncedPage(initialPage);
    setIndex(initialPage);
  }

  // 스크롤 위치는 외부 시스템이라 이펙트에서 맞춥니다.
  useEffect(() => {
    scrollX.setValue(initialPage * width);
    scrollRef.current?.scrollTo({ x: initialPage * width, animated: false });
  }, [initialPage, scrollX, width]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);

    if (next !== index) {
      setIndex(next);
    }
  }

  return (
    // 일러스트가 상태 바 아래까지 올라와야 해서 상단 인셋은 잡지 않습니다.
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <Animated.ScrollView
        contentOffset={{ x: initialPage * width, y: 0 }}
        horizontal
        onMomentumScrollEnd={handleScroll}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        pagingEnabled
        ref={scrollRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        {PAGES.map((page) => {
          const ratio = aspectRatioOf(page.illustration);
          const artWidth = Math.min(height * page.height * ratio, width - spacing[8]);
          const artHeight = artWidth / ratio;

          return (
            <View key={page.title} style={[styles.page, { width }]}>
              <View style={[styles.illustrationBox, { height: height * ILLUSTRATION_BAND }]}>
                <Image
                  resizeMode="contain"
                  source={page.illustration}
                  style={{
                    height: artHeight,
                    left: (width - artWidth) / 2 + artWidth * (page.shiftX ?? 0),
                    position: 'absolute',
                    top: height * (page.top + ILLUSTRATION_NUDGE),
                    width: artWidth,
                  }}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.center} variant="headline-1" weight="semibold">
                  {page.title}
                </Text>
                <Text style={[styles.center, styles.body]} variant="body-1">
                  {page.body}
                </Text>
              </View>
              <View style={styles.spacer} />
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.dots}>
        <PageDots count={PAGES.length} index={index} progress={progress} />
      </View>

      {/* 건너뛰기 링크가 없는 화면이라 버튼 아래를 더 띄웁니다. */}
      <BottomBar bottomGap={BOTTOM_GAP_NO_LINK}>
        <PrimaryButton label="시작하기" onPress={onStart} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  dots: {
    paddingBottom: spacing[5],
    paddingTop: spacing[1],
  },
  page: {
    flex: 1,
  },
  illustrationBox: {
    flexShrink: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing[5],
  },
  copy: {
    paddingHorizontal: SCREEN_X,
    paddingTop: spacing[7],
  },
  /** 일러스트와 본문을 위로 붙이고 남는 공간은 아래에 모읍니다. */
  spacer: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  body: {
    marginTop: spacing[3],
  },
});
