/* eslint-disable @typescript-eslint/no-require-imports -- 프로덕션 번들에 개발 전용 패키지(reactotron)가 포함되지 않도록 __DEV__ 내부에서 dynamic require를 수행합니다. */
import type { ReactotronTron, ReactotronBenchmark } from '../../global';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

if (isDev) {
  const Constants = require('expo-constants').default;
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const Reactotron = require('reactotron-react-native').default || require('reactotron-react-native');

  // Metro 번들러 호스트 IP 추출 (IP:Port 형태에서 IP만 분리)
  const hostUri = Constants.expoConfig?.hostUri;
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
  tronInstance.benchmark = (title: string): ReactotronBenchmark => {
    const start = Date.now();
    let last = start;
    tronInstance.display({
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
        tronInstance.display({
          name: `⏱ STEP: ${title}${stepName ? ` - ${stepName}` : ''}`,
          preview: `+${delta}ms (누적: ${total}ms)`,
          value: { stepName, delta, total },
        });
      },
      last: (stepName?: string) => {
        const now = Date.now();
        const lap = now - last;
        tronInstance.display({
          name: `⏱ LAP: ${title}${stepName ? ` - ${stepName}` : ''}`,
          preview: `구간: ${lap}ms`,
          value: { stepName, lap },
        });
      },
      stop: (stepName?: string) => {
        const now = Date.now();
        const total = now - start;
        tronInstance.display({
          name: `🏁 BENCHMARK END: ${title}${stepName ? ` - ${stepName}` : ''}`,
          preview: `총 소요 시간: ${total}ms`,
          value: { stepName, total },
          important: true,
        });
      },
    };
  };

  console.tron = tronInstance;
} else {
  // 운영 환경: 어떠한 메서드 호출에도 앱이 죽지 않도록 Proxy 기반 No-op 더미 객체 할당
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

  console.tron = safeDummyTron as ReactotronTron;
}
