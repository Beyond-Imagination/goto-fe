/* eslint-disable no-console -- logger의 콘솔 출력 인터셉트와 모킹을 위해 허용합니다. */
import assert from 'node:assert/strict';
import test, { beforeEach, afterEach } from 'node:test';

import { createNoopTron, createTronBenchmark } from '@/config/reactotron';
import { formatLogMessage, isDev, logger, normalizeLogValue } from '@/utils/logger';

const originalDev = (globalThis as Record<string, unknown>).__DEV__;
const originalNodeEnv = process.env.NODE_ENV;
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalTron = (console as unknown as { tron: unknown }).tron;

let capturedLogs: unknown[][] = [];
let capturedWarns: unknown[][] = [];
let capturedErrors: unknown[][] = [];

beforeEach(() => {
  capturedLogs = [];
  capturedWarns = [];
  capturedErrors = [];

  console.log = (...args: unknown[]) => {
    capturedLogs.push(args);
  };
  console.warn = (...args: unknown[]) => {
    capturedWarns.push(args);
  };
  console.error = (...args: unknown[]) => {
    capturedErrors.push(args);
  };
});

afterEach(() => {
  if (originalDev === undefined) {
    delete (globalThis as Record<string, unknown>).__DEV__;
  } else {
    (globalThis as Record<string, unknown>).__DEV__ = originalDev;
  }
  process.env.NODE_ENV = originalNodeEnv;

  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  (console as unknown as { tron: unknown }).tron = originalTron;
});

test('isDev: __DEV__ 및 NODE_ENV 설정에 따른 개발/운영 환경 판별', () => {
  (globalThis as Record<string, unknown>).__DEV__ = true;
  assert.equal(isDev(), true);

  (globalThis as Record<string, unknown>).__DEV__ = false;
  assert.equal(isDev(), false);

  delete (globalThis as Record<string, unknown>).__DEV__;
  process.env.NODE_ENV = 'production';
  assert.equal(isDev(), false);

  process.env.NODE_ENV = 'development';
  assert.equal(isDev(), true);

  process.env.NODE_ENV = 'test';
  assert.equal(isDev(), true);
});

test('normalizeLogValue: Error 인스턴스 정규화 및 원시값/객체 보존', () => {
  const err = new Error('Test error message');
  const normalized = normalizeLogValue(err) as { name: string; message: string; stack?: string };
  assert.equal(normalized.name, 'Error');
  assert.equal(normalized.message, 'Test error message');
  assert.ok(typeof normalized.stack === 'string');

  class CustomError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'CustomError';
    }
  }
  const customErr = new CustomError('Custom message');
  const normalizedCustom = normalizeLogValue(customErr) as { name: string; message: string };
  assert.equal(normalizedCustom.name, 'CustomError');
  assert.equal(normalizedCustom.message, 'Custom message');

  assert.equal(normalizeLogValue('plain string'), 'plain string');
  assert.equal(normalizeLogValue(123), 123);
  assert.equal(normalizeLogValue(true), true);
  assert.equal(normalizeLogValue(null), null);
  assert.equal(normalizeLogValue(undefined), undefined);

  const obj = { foo: 'bar', count: 1 };
  assert.deepEqual(normalizeLogValue(obj), obj);

  const arr = [1, 'two', { three: 3 }];
  assert.deepEqual(normalizeLogValue(arr), arr);
});

test('formatLogMessage: 문자열 및 비문자열 메시지 변환', () => {
  assert.equal(formatLogMessage('hello'), 'hello');
  assert.equal(formatLogMessage(12345), '12345');
  assert.equal(formatLogMessage({ id: 1 }), '[object Object]');
});

test('개발 환경(DEV): logger.debug는 console.log와 console.tron.log를 호출한다', () => {
  (globalThis as Record<string, unknown>).__DEV__ = true;

  const tronLogs: unknown[][] = [];
  (console as unknown as { tron: unknown }).tron = {
    log: (...args: unknown[]) => {
      tronLogs.push(args);
    },
  };

  logger.debug('Debug message', { extra: 1 });

  assert.equal(capturedLogs.length, 1);
  assert.equal(capturedLogs[0][0], '[DEBUG]');
  assert.equal(capturedLogs[0][1], 'Debug message');
  assert.deepEqual(capturedLogs[0][2], { extra: 1 });

  assert.equal(tronLogs.length, 1);
  assert.equal(tronLogs[0][0], 'Debug message');
  assert.deepEqual(tronLogs[0][1], { extra: 1 });
});

test('개발 환경(DEV): logger.display는 console.log와 console.tron.display를 호출한다', () => {
  (globalThis as Record<string, unknown>).__DEV__ = true;

  const tronDisplays: unknown[] = [];
  (console as unknown as { tron: unknown }).tron = {
    display: (config: unknown) => {
      tronDisplays.push(config);
    },
  };

  const displayConfig = {
    name: 'CUSTOM_EVENT',
    preview: 'preview text',
    value: { id: 10 },
  };
  logger.display(displayConfig);

  assert.equal(capturedLogs.length, 1);
  assert.equal(capturedLogs[0][0], '[DISPLAY: CUSTOM_EVENT]');
  assert.deepEqual(capturedLogs[0][1], { id: 10 });

  assert.equal(tronDisplays.length, 1);
  assert.deepEqual(tronDisplays[0], displayConfig);
});

test('개발 환경(DEV): logger.warn은 console.warn과 console.tron.warn을 호출하며 Error를 구조화한다', () => {
  (globalThis as Record<string, unknown>).__DEV__ = true;

  const tronWarns: unknown[] = [];
  (console as unknown as { tron: unknown }).tron = {
    warn: (payload: unknown) => {
      tronWarns.push(payload);
    },
  };

  // 단일 메시지
  logger.warn('Warning 1');
  assert.equal(capturedWarns.length, 1);
  assert.equal(capturedWarns[0][0], '[WARN]');
  assert.equal(capturedWarns[0][1], 'Warning 1');
  assert.equal(tronWarns[0], 'Warning 1');

  // Error 객체와 상세 파라미터가 포함된 경우
  const testError = new Error('Warning error detail');
  logger.warn('Warning 2', testError, { detail: 'extra' });

  assert.equal(capturedWarns.length, 2);
  assert.equal(capturedWarns[1][0], '[WARN]');
  assert.equal(capturedWarns[1][1], 'Warning 2');

  assert.equal(tronWarns.length, 2);
  const secondWarn = tronWarns[1] as { message: unknown; details: unknown[] };
  assert.equal(secondWarn.message, 'Warning 2');
  assert.equal(secondWarn.details.length, 2);
  const normalizedErr = secondWarn.details[0] as { name: string; message: string };
  assert.equal(normalizedErr.name, 'Error');
  assert.equal(normalizedErr.message, 'Warning error detail');
  assert.deepEqual(secondWarn.details[1], { detail: 'extra' });
});

test('개발 환경(DEV): logger.error는 [ERROR] console.error와 console.tron.error/display를 호출한다', () => {
  (globalThis as Record<string, unknown>).__DEV__ = true;

  const tronErrors: unknown[] = [];
  const tronDisplays: unknown[] = [];
  (console as unknown as { tron: unknown }).tron = {
    error: (msg: unknown) => {
      tronErrors.push(msg);
    },
    display: (config: unknown) => {
      tronDisplays.push(config);
    },
  };

  // 단일 에러 메시지
  logger.error('Single error');
  assert.equal(capturedErrors.length, 1);
  assert.equal(capturedErrors[0][0], '[ERROR]');
  assert.equal(capturedErrors[0][1], 'Single error');
  assert.equal(tronErrors.length, 1);
  assert.equal(tronErrors[0], 'Single error');
  assert.equal(tronDisplays.length, 0);

  // 에러 객체 포함 시 display로 구조화된 진단 정보 전송
  const errorObj = new Error('Crash details');
  logger.error('API failure', errorObj, { statusCode: 500 });

  assert.equal(capturedErrors.length, 2);
  assert.equal(capturedErrors[1][0], '[ERROR]');
  assert.equal(capturedErrors[1][1], 'API failure');
  assert.equal(capturedErrors[1][2], errorObj);

  assert.equal(tronErrors.length, 2);
  assert.equal(tronErrors[1], 'API failure');

  assert.equal(tronDisplays.length, 1);
  const displayPayload = tronDisplays[0] as {
    name: string;
    preview: string;
    value: { message: unknown; details: unknown[] };
    important: boolean;
  };
  assert.equal(displayPayload.name, 'ERROR');
  assert.equal(displayPayload.preview, 'API failure');
  assert.equal(displayPayload.important, true);
  assert.equal(displayPayload.value.message, 'API failure');
  const normalizedDetail = displayPayload.value.details[0] as { name: string; message: string };
  assert.equal(normalizedDetail.name, 'Error');
  assert.equal(normalizedDetail.message, 'Crash details');
  assert.deepEqual(displayPayload.value.details[1], { statusCode: 500 });
});

test('개발 환경(DEV): logger.benchmark는 Reactotron benchmark가 없을 때 fallback으로 start/last를 추적한다', () => {
  (globalThis as Record<string, unknown>).__DEV__ = true;
  (console as unknown as { tron: unknown }).tron = undefined;

  const bench = logger.benchmark('DataFetch');

  bench.step('Step 1');
  assert.equal(capturedLogs.length, 1);
  assert.match(String(capturedLogs[0][0]), /^\[BENCHMARK STEP\] DataFetch - Step 1: \+\d+ms \(누적: \d+ms\)$/);

  bench.last('Lap 1');
  assert.equal(capturedLogs.length, 2);
  assert.match(String(capturedLogs[1][0]), /^\[BENCHMARK LAP\] DataFetch - Lap 1: 구간: \d+ms$/);

  bench.stop('Done');
  assert.equal(capturedLogs.length, 3);
  assert.match(String(capturedLogs[2][0]), /^\[BENCHMARK STOP\] DataFetch - Done: 총 소요 시간: \d+ms$/);
});

test('운영 환경(PROD): debug, display, warn은 완전히 무음화되고 error는 console.error를 보존한다', () => {
  (globalThis as Record<string, unknown>).__DEV__ = false;

  let tronCalled = false;
  (console as unknown as { tron: unknown }).tron = {
    log: () => {
      tronCalled = true;
    },
    warn: () => {
      tronCalled = true;
    },
    error: () => {
      tronCalled = true;
    },
    display: () => {
      tronCalled = true;
    },
  };

  logger.debug('Silent debug');
  logger.display({ name: 'Silent display' });
  logger.warn('Silent warn');

  assert.equal(capturedLogs.length, 0);
  assert.equal(capturedWarns.length, 0);
  assert.equal(tronCalled, false);

  // 운영 환경에서 error는 크래시 추적/Sentry를 위해 console.error 유지 (단, [ERROR] 프리픽스 없이 순수 메시지/에러 전달)
  const prodErr = new Error('Production error');
  logger.error('Payment failed', prodErr);

  assert.equal(capturedErrors.length, 1);
  assert.equal(capturedErrors[0][0], 'Payment failed');
  assert.equal(capturedErrors[0][1], prodErr);
  assert.equal(tronCalled, false);

  // benchmark도 no-op이므로 콘솔 출력이 없어야 함
  const prodBench = logger.benchmark('ProdBenchmark');
  prodBench.step('Step');
  prodBench.last('Lap');
  prodBench.stop('Stop');
  assert.equal(capturedLogs.length, 0);
});

test('createNoopTron: 임의의 메서드나 속성 접근에도 예외를 던지지 않는다', () => {
  const safeTron = createNoopTron();

  assert.doesNotThrow(() => {
    safeTron.log('test');
    safeTron.warn('test');
    safeTron.error('test');
    safeTron.display({ name: 'test' });
    safeTron.clear();

    const bench = safeTron.benchmark('test');
    bench.step('step');
    bench.last('last');
    bench.stop('stop');

    // 존재하지 않는 임의 메서드 호출 시에도 no-op 안전 처리
    (safeTron as unknown as Record<string, () => void>).unknownMethod();
  });
});

test('createTronBenchmark: last()가 호출될 때마다 last를 갱신하여 각 구간 시간이 독립적으로 계산된다', () => {
  const displayed: { name: string; preview: string; value?: unknown }[] = [];
  const display = (config: { name: string; preview?: string; value?: unknown }) => {
    displayed.push({ name: config.name, preview: config.preview ?? '', value: config.value });
  };

  const bench = createTronBenchmark(display, 'ProfileLoad');
  assert.equal(displayed.length, 1);
  assert.match(displayed[0].name, /^⏱ BENCHMARK START: ProfileLoad$/);

  // step 호출 검증
  bench.step('Fetch');
  assert.equal(displayed.length, 2);
  assert.match(displayed[1].name, /^⏱ STEP: ProfileLoad - Fetch$/);
  assert.match(displayed[1].preview, /^\+\d+ms \(누적: \d+ms\)$/);

  // 첫 번째 last() 호출
  bench.last('Checkpoint 1');
  assert.equal(displayed.length, 3);
  assert.match(displayed[2].name, /^⏱ LAP: ProfileLoad - Checkpoint 1$/);
  assert.match(displayed[2].preview, /^구간: \d+ms$/);

  // 두 번째 last() 호출: last = now 갱신이 정상 동작하여 누적이 아닌 최근 체크포인트 기준 구간 측정
  bench.last('Checkpoint 2');
  assert.equal(displayed.length, 4);
  assert.match(displayed[3].name, /^⏱ LAP: ProfileLoad - Checkpoint 2$/);
  assert.match(displayed[3].preview, /^구간: \d+ms$/);

  // stop 호출 검증
  bench.stop('Finished');
  assert.equal(displayed.length, 5);
  assert.match(displayed[4].name, /^🏁 BENCHMARK END: ProfileLoad - Finished$/);
  assert.match(displayed[4].preview, /^총 소요 시간: \d+ms$/);
});
