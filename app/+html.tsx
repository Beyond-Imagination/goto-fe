import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Expo Router 웹 전용 Root HTML Document
 * 파비콘, 뷰포트, 언어(ko) 및 웹 메타 태그를 명시적으로 주입합니다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        {/* React Native Web의 ScrollView 스타일 리셋 */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
