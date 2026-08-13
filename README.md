# goto-fe
2026년 관광데이터활용 공모전 `함께가길` 프로젝트 프론트엔드 레포지토리

## 개발 실행

```bash
pnpm install
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm start
```

Android Emulator에서 로컬 BE를 호출할 때는 `http://10.0.2.2:8080`처럼 에뮬레이터 기준 호스트를 사용하세요.

## 환경 변수

- `EXPO_PUBLIC_API_BASE_URL`: `/api/v1/auth/oauth/login`, `/api/v1/auth/oauth/signup`, `/api/v1/auth/refresh`를 호출할 BE 서버 URL
- `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`: Kakao Developers 앱의 Native App Key. Android 네이티브 로그인 빌드에 필요합니다.
