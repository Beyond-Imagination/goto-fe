import type { ReactotronBenchmark, ReactotronDisplayConfig } from '../../global';

export type LoggerBenchmarkSession = ReactotronBenchmark;

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function normalizeLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

function formatLogMessage(message: unknown): string {
  return typeof message === 'string' ? message : String(message);
}

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
      console.tron?.warn?.(
        optionalParams.length === 0
          ? normalizeLogValue(message)
          : {
              message: normalizeLogValue(message),
              details: optionalParams.map(normalizeLogValue),
            },
      );
    }
  },

  /**
   * 에러 로그 (운영 환경에서도 크래시 추적을 위해 보존되며, 향후 Sentry 등 에러 모니터링 연동 가능)
   */
  error: (message: unknown, error?: unknown, ...optionalParams: unknown[]): void => {
    if (isDev) {
      if (error === undefined) {
        console.error('[ERROR]', message, ...optionalParams);
      } else {
        console.error('[ERROR]', message, error, ...optionalParams);
      }

      console.tron?.error?.(formatLogMessage(message));

      if (error !== undefined || optionalParams.length > 0) {
        console.tron?.display?.({
          name: 'ERROR',
          preview: formatLogMessage(message),
          value: {
            message: normalizeLogValue(message),
            details: [error, ...optionalParams].filter((value) => value !== undefined).map(normalizeLogValue),
          },
          important: true,
        });
      }
    } else {
      if (error === undefined) {
        console.error(message, ...optionalParams);
      } else {
        console.error(message, error, ...optionalParams);
      }
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
