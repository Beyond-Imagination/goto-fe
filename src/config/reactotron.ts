/* eslint-disable @typescript-eslint/no-require-imports -- 프로덕션 번들에 개발 전용 패키지(reactotron)가 포함되지 않도록 __DEV__ 내부에서 dynamic require를 수행합니다. */
import type { ReactotronTron, ReactotronBenchmark, ReactotronDisplayConfig } from '@/global';

/**
 * 어떠한 메서드 호출에도 앱이 중단되지 않도록 보호하는 Proxy 기반 No-op 더미 객체 생성 함수
 */
export function createNoopTron(): ReactotronTron {
  const noop = () => {};
  const noopBenchmark: ReactotronBenchmark = {
    step: noop,
    last: noop,
    stop: noop,
  };

  const dummyTron: Partial<ReactotronTron> = {
    log: noop,
    warn: noop,
    error: noop,
    display: noop,
    clear: noop,
    benchmark: () => noopBenchmark,
  };

  const safeDummyTron = new Proxy(dummyTron, {
    get: (target, prop) => {
      if (prop in target) {
        return (target as Record<string | symbol, unknown>)[prop];
      }
      if (prop === 'benchmark') {
        return () => noopBenchmark;
      }
      return noop;
    },
  });

  return safeDummyTron as ReactotronTron;
}

/**
 * Reactotron display 기반의 성능 벤치마크 측정 헬퍼 생성 함수
 */
export function createTronBenchmark(
  display: (config: ReactotronDisplayConfig) => void,
  title: string,
): ReactotronBenchmark {
  const start = Date.now();
  let last = start;
  display({
    name: `⏱ BENCHMARK START: ${title}`,
    preview: `시작 시간: ${new Date(start).toLocaleTimeString()}`,
    value: { timestamp: start },
  });

  return {
    step: (stepName?: string) => {
      const now = Date.now();
      const delta = now - last;
      const total = now - start;
      last = now;
      display({
        name: `⏱ STEP: ${title}${stepName ? ` - ${stepName}` : ''}`,
        preview: `+${delta}ms (누적: ${total}ms)`,
        value: { stepName, delta, total },
      });
    },
    last: (stepName?: string) => {
      const now = Date.now();
      const lap = now - last;
      last = now;
      display({
        name: `⏱ LAP: ${title}${stepName ? ` - ${stepName}` : ''}`,
        preview: `구간: ${lap}ms`,
        value: { stepName, lap },
      });
    },
    stop: (stepName?: string) => {
      const now = Date.now();
      const total = now - start;
      display({
        name: `🏁 BENCHMARK END: ${title}${stepName ? ` - ${stepName}` : ''}`,
        preview: `총 소요 시간: ${total}ms`,
        value: { stepName, total },
        important: true,
      });
    },
  };
}

const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : process.env.NODE_ENV !== 'production';

if (isDev) {
  try {
    const Constants = require('expo-constants').default;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const Reactotron = require('reactotron-react-native').default || require('reactotron-react-native');

    // Metro 번들러 호스트 IP 추출 (IP:Port 형태에서 IP만 분리)
    const hostUri = Constants?.expoConfig?.hostUri;
    const host = hostUri ? hostUri.split(':')[0] : 'localhost';

    if (Reactotron.setAsyncStorageHandler) {
      Reactotron.setAsyncStorageHandler(AsyncStorage);
    }

    Reactotron.configure({
      name: 'GOTO Mobile',
      host,
    })
      .useReactNative({
        asyncStorage: true,
        networking: {
          ignoreUrls: /symbolicate|hot-update|logs/,
        },
      })
      .connect();

    Reactotron.clear?.();

    // 벤치마크 헬퍼 구현체 주입
    const tronInstance = Reactotron as unknown as ReactotronTron;
    tronInstance.benchmark = (title: string): ReactotronBenchmark =>
      createTronBenchmark((config) => tronInstance.display(config), title);

    console.tron = tronInstance;
  } catch (err) {
    // 개발 환경에서 Reactotron 초기화가 실패하더라도 앱이 크래시되지 않도록 안전한 no-op 구현을 주입합니다.
    console.tron = createNoopTron();
    console.warn?.('[Reactotron] 초기화 실패 (no-op fallback 적용):', err);
  }
} else {
  // 운영 환경: 어떠한 메서드 호출에도 앱이 죽지 않도록 Proxy 기반 No-op 더미 객체 할당
  console.tron = createNoopTron();
}
