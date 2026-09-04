export interface ReactotronBenchmark {
  step: (stepName?: string) => void;
  last: (stepName?: string) => void;
  stop: (stepName?: string) => void;
}

export interface ReactotronDisplayConfig {
  name: string;
  value?: unknown;
  preview?: string;
  image?: string;
  important?: boolean;
}

export interface ReactotronTron {
  log: (...args: unknown[]) => void;
  warn: (message?: unknown, ...args: unknown[]) => void;
  error: (message?: unknown, stack?: unknown) => void;
  display: (config: ReactotronDisplayConfig) => void;
  clear: () => void;
  benchmark: (title: string) => ReactotronBenchmark;
  [key: string]: any;
}

declare global {
  interface Console {
    tron: ReactotronTron;
  }
}

export {};
