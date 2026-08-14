declare module '*.png' {
  const value: any;
  export default value;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?: string;
    EXPO_PUBLIC_AUTH_MODE?: 'live' | 'mock';
    EXPO_PUBLIC_DEV_PERSONA?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function atob(data: string): string;
