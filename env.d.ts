declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    NAVER_MAP_CLIENT_ID?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function atob(data: string): string;
