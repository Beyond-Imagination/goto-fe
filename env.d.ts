declare module '*.png' {
  const value: any;
  export default value;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function atob(data: string): string;
