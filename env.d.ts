declare module '*.png' {
  const value: any;
  export default value;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?: string;
    EXPO_PUBLIC_NAVER_CONSUMER_KEY?: string;
    EXPO_PUBLIC_NAVER_CONSUMER_SECRET?: string;
    EXPO_PUBLIC_NAVER_APP_NAME?: string;
    EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME?: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?: string;
    EXPO_PUBLIC_AUTH_MODE?: 'live' | 'mock';
    EXPO_PUBLIC_DEV_PERSONA?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function atob(data: string): string;
