import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toPushNotificationType, toPushTarget } from '@/push';

describe('toPushTarget', () => {
  it('저장 탭 알림은 저장 탭으로 보내고 placeId를 넘긴다', () => {
    const target = toPushTarget({
      type: 'SAVED_PLACE_STATUS_CHANGE',
      route: '/(tabs)/saved',
      placeId: '4102',
    });

    assert.deepEqual(target, { pathname: '/(tabs)/saved', params: { placeId: '4102' } });
  });

  it('장애물 상세는 id를 파라미터로 넘긴다', () => {
    const target = toPushTarget({ type: 'MY_REPORT_CONFIRMED', route: '/report/detail', id: '77' });

    assert.deepEqual(target, { pathname: '/report/detail', params: { id: '77' } });
  });

  it('도움 요청 알림은 helpRequestId를 넘긴다', () => {
    const target = toPushTarget({
      route: '/help/request-review',
      helpRequestId: '0198f0a2-0000-7000-8000-000000000000',
    });

    assert.deepEqual(target, {
      pathname: '/help/request-review',
      params: { helpRequestId: '0198f0a2-0000-7000-8000-000000000000' },
    });
  });

  it('숫자로 온 값도 문자열 파라미터로 바꿔 넘긴다', () => {
    // 로컬 알림을 거쳐 오면 FCM data와 달리 숫자가 그대로 남아 있을 수 있습니다.
    const target = toPushTarget({ route: '/report/detail', id: 77 });

    assert.deepEqual(target?.params, { id: '77' });
  });

  it('모르는 경로는 열지 않는다 — payload를 그대로 믿고 이동하지 않는다', () => {
    assert.equal(toPushTarget({ route: '/admin/secret' }), null);
    assert.equal(toPushTarget({ route: 'https://evil.example.com' }), null);
    assert.equal(toPushTarget({ route: '' }), null);
  });

  it('route가 없으면 아무 것도 하지 않는다', () => {
    assert.equal(toPushTarget({ type: 'MY_REPORT_CONFIRMED' }), null);
    assert.equal(toPushTarget(null), null);
    assert.equal(toPushTarget(undefined), null);
  });

  it('허용하지 않은 파라미터는 버린다', () => {
    const target = toPushTarget({ route: '/report/detail', id: '1', redirect: 'https://evil.example.com' });

    assert.deepEqual(target?.params, { id: '1' });
  });
});

describe('toPushNotificationType', () => {
  it('아는 종류만 돌려준다', () => {
    assert.equal(toPushNotificationType({ type: 'NEARBY_HELP_REQUEST' }), 'NEARBY_HELP_REQUEST');
    assert.equal(toPushNotificationType({ type: 'SOMETHING_NEW' }), null);
    assert.equal(toPushNotificationType({}), null);
    assert.equal(toPushNotificationType(null), null);
  });
});
