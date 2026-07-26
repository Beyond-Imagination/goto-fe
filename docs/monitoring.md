# 모니터링 구성

## 데이터 흐름

```text
Expo 앱
  -> Sentry React Native SDK
  -> Sentry Issue Alert
  -> 백엔드 Sentry Webhook 수신 엔드포인트
  -> Discord Forum Webhook
```

앱은 Discord Webhook을 직접 호출하지 않는다. Discord Webhook URL과 Sentry
Integration Client Secret은 백엔드 비밀값으로 관리한다.

## 앱 환경 변수

| 변수 | 용도 | 공개 여부 |
| --- | --- | --- |
| `EXPO_PUBLIC_SENTRY_DSN` | 앱 오류를 전송할 Sentry 프로젝트 DSN | 앱 번들에 포함되는 공개 식별자 |
| `EXPO_PUBLIC_APP_ENVIRONMENT` | `development`, `staging`, `production` 환경 구분 | 공개 |
| `EXPO_PUBLIC_API_BASE_URL` | 백엔드 API 기본 URL | 공개 |

이벤트는 DSN이 있고, `__DEV__`가 `false`이며,
`EXPO_PUBLIC_APP_ENVIRONMENT`가 `production`인 경우에만 전송된다.
개발 서버와 staging 환경에서는 Sentry SDK가 초기화되더라도 이벤트 전송이
비활성화된다.

소스맵 업로드에 필요한 아래 값은 EAS 또는 CI의 비밀 환경 변수로만 설정한다.
`EXPO_PUBLIC_` 접두사를 붙이지 않는다.

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_URL` (self-hosted Sentry를 사용할 때만 필요)

## 필요한 백엔드 엔드포인트

필수 엔드포인트는 하나다.

```http
POST /api/v1/integrations/sentry/webhook
Content-Type: application/json
Request-ID: <uuid>
Sentry-Hook-Resource: event_alert
Sentry-Hook-Timestamp: <timestamp>
Sentry-Hook-Signature: <hmac-sha256>
```

### 처리 규칙

1. 원본 요청 본문과 Sentry Integration Client Secret으로
   `Sentry-Hook-Signature`를 검증한다.
2. `Sentry-Hook-Resource`가 `event_alert`인 Issue Alert만 처리한다.
3. `Request-ID`를 멱등 키로 저장해 Sentry의 재전송이 중복 알림을 만들지 않게 한다.
4. `data.event.issue_id`를 기준으로 Discord 스레드 ID를 조회한다.
5. 매핑이 없으면 Discord Forum Webhook에 `thread_name`과 첫 메시지를 보내
   스레드를 생성하고, 응답의 `channel_id`를 저장한다.
6. 매핑이 있으면 Discord Forum Webhook의 `thread_id` 쿼리 파라미터로 같은
   스레드에 재발·회귀·해결 메시지를 추가한다.
7. 사용자 입력이 Discord 멘션으로 해석되지 않도록 `allowed_mentions.parse`는
   빈 배열로 전송한다.
8. Discord 호출은 `wait=true`로 실행해 생성 결과를 확인하고, Discord의
   `429` 응답과 `retry_after`를 준수한다.

### 응답

| 상황 | 응답 |
| --- | --- |
| 이벤트를 내구성 있게 큐에 저장함 | `202 Accepted` |
| 동기 처리를 정상 완료함 | `204 No Content` |
| 서명 누락 또는 불일치 | `401 Unauthorized` |
| JSON 또는 필수 필드 오류 | `400 Bad Request` |

Sentry에는 Discord 호출 완료를 기다리기보다, 이벤트를 큐에 저장한 직후
`202`를 반환하는 방식을 권장한다.

### Discord 호출 예시

새 Issue:

```http
POST https://discord.com/api/webhooks/{webhook.id}/{webhook.token}?wait=true
Content-Type: application/json

{
  "thread_name": "[production][error] TypeError",
  "embeds": [
    {
      "title": "새 Sentry Issue",
      "description": "오류 요약",
      "url": "https://sentry.io/organizations/.../issues/..."
    }
  ],
  "allowed_mentions": {
    "parse": []
  }
}
```

기존 Issue:

```http
POST https://discord.com/api/webhooks/{webhook.id}/{webhook.token}?wait=true&thread_id={discord.thread.id}
Content-Type: application/json

{
  "content": "오류가 다시 발생했습니다.",
  "allowed_mentions": {
    "parse": []
  }
}
```

## Sentry Alert 권장 조건

- 환경이 `production`
- Issue가 처음 생성됨
- 해결된 Issue가 회귀함
- `error` 또는 `fatal` 레벨
- 짧은 시간 동안 발생량 또는 영향 사용자 수가 임계값을 초과함

알림 규칙에서 Webhook Action의 대상 URL로
`POST /api/v1/integrations/sentry/webhook`의 공개 HTTPS 주소를 등록한다.

## 검증

1. production 빌드에서 의도적인 예외를 한 번 전송한다.
2. Sentry에서 environment, release, stack trace, source map 적용 여부를 확인한다.
3. 같은 Issue를 두 번 발생시켜 백엔드가 Discord 스레드를 하나만 생성하는지 확인한다.
4. 해결 후 다시 발생시켜 같은 스레드에 회귀 알림이 추가되는지 확인한다.
5. 잘못된 서명과 동일한 `Request-ID` 재전송이 각각 거부·무시되는지 확인한다.
