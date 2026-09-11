import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { decideRegistration, toDevicePlatform } from '@/push/pushRegistrationState';

const BASE = {
  isLoggedIn: true,
  permission: 'granted',
  token: 'fcm-token',
  registeredToken: null,
} as const;

describe('decideRegistration', () => {
  it('로그인 + 권한 + 토큰이 갖춰지면 등록한다', () => {
    assert.deepEqual(decideRegistration(BASE), { kind: 'register', token: 'fcm-token' });
  });

  it('이미 같은 토큰을 등록했으면 아무 것도 하지 않는다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, registeredToken: 'fcm-token' }), { kind: 'none' });
  });

  it('토큰이 재발급되면 새 토큰으로 다시 등록한다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, token: 'new-token', registeredToken: 'old-token' }), {
      kind: 'register',
      token: 'new-token',
    });
  });

  it('로그아웃하면 등록해 둔 토큰을 해제한다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, isLoggedIn: false, registeredToken: 'fcm-token' }), {
      kind: 'unregister',
      token: 'fcm-token',
    });
  });

  it('권한이 사라지면(설정에서 끔) 등록을 해제한다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, permission: 'denied', registeredToken: 'fcm-token' }), {
      kind: 'unregister',
      token: 'fcm-token',
    });
  });

  it('토큰을 못 받으면 등록을 해제한다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, token: null, registeredToken: 'fcm-token' }), {
      kind: 'unregister',
      token: 'fcm-token',
    });
  });

  it('받을 수 없는 상태이고 등록한 적도 없으면 아무 것도 하지 않는다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, isLoggedIn: false, token: null }), { kind: 'none' });
    assert.deepEqual(decideRegistration({ ...BASE, permission: 'undetermined' }), { kind: 'none' });
    assert.deepEqual(decideRegistration({ ...BASE, permission: 'unavailable' }), { kind: 'none' });
  });

  it('로그인 전에는 권한과 토큰이 있어도 등록하지 않는다 — 토큰은 회원에 묶인다', () => {
    assert.deepEqual(decideRegistration({ ...BASE, isLoggedIn: false }), { kind: 'none' });
  });
});

describe('toDevicePlatform', () => {
  it('앱이 도는 플랫폼만 BE enum으로 바꾼다', () => {
    assert.equal(toDevicePlatform('android'), 'ANDROID');
    assert.equal(toDevicePlatform('ios'), 'IOS');
    assert.equal(toDevicePlatform('web'), null);
    assert.equal(toDevicePlatform('windows'), null);
  });
});
