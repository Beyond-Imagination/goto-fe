declare module '*.png' {
  const value: any;
  export default value;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_APP_ENVIRONMENT?: string;
    EXPO_PUBLIC_SENTRY_DSN?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function atob(data: string): string;
