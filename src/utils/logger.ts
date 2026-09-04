import type { ReactotronBenchmark, ReactotronDisplayConfig } from '../../global';

export type LoggerBenchmarkSession = ReactotronBenchmark;

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

/**
 * 프로젝트 전역 단일 진입점 로거 유틸리티 (3-Tier Logging Defense - Tier 1)
 * 컴포넌트나 비즈니스 로직에서 console.log나 console.tron을 직접 호출하지 않고 본 유틸을 사용합니다.
 */
export const logger = {
  /**
   * 개발 전용 디버그 로그 (운영 환경에서는 완전히 무음화)
   */
  debug: (message: unknown, ...optionalParams: unknown[]): void => {
    if (isDev) {
      console.log('[DEBUG]', message, ...optionalParams);
      console.tron?.log?.(message, ...optionalParams);
    }
  },

  /**
   * Reactotron 전용 구조화된 데이터 시각화 로그 (개발 환경 전용)
   */
  display: (config: ReactotronDisplayConfig): void => {
    if (isDev) {
      console.log(`[DISPLAY: ${config.name}]`, config.value ?? config.preview ?? '');
      console.tron?.display?.(config);
    }
  },

  /**
   * 경고 로그
   */
  warn: (message: unknown, ...optionalParams: unknown[]): void => {
    if (isDev) {
      console.warn('[WARN]', message, ...optionalParams);
      console.tron?.warn?.(message, ...optionalParams);
    }
  },

  /**
   * 에러 로그 (운영 환경에서도 크래시 추적을 위해 보존되며, 향후 Sentry 등 에러 모니터링 연동 가능)
   */
  error: (message: unknown, error?: unknown): void => {
    if (isDev) {
      console.error('[ERROR]', message, error);
      console.tron?.error?.(message, error);
    } else {
      console.error(message, error);
      // 향후 Sentry / Crashlytics 연동 예시:
      // Sentry.captureException(error ?? new Error(String(message)));
    }
  },

  /**
   * 성능 벤치마크 측정 유틸리티
   */
  benchmark: (title: string): LoggerBenchmarkSession => {
    if (isDev) {
      if (console.tron?.benchmark) {
        return console.tron.benchmark(title);
      }
      const start = Date.now();
      return {
        step: (stepName?: string) => {
          console.log(`[BENCHMARK STEP] ${title} - ${stepName ?? ''}: +${Date.now() - start}ms`);
        },
        last: (stepName?: string) => {
          console.log(`[BENCHMARK LAP] ${title} - ${stepName ?? ''}`);
        },
        stop: (stepName?: string) => {
          console.log(`[BENCHMARK STOP] ${title} - ${stepName ?? ''}: Total ${Date.now() - start}ms`);
        },
      };
    }

    const noop = () => {};
    return {
      step: noop,
      last: noop,
      stop: noop,
    };
  },
};

export default logger;
