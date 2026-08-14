import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEV_PERSONAS,
  NEW_SIGNUP_USER,
  WHEELCHAIR_USER,
  STROLLER_USER,
  SENIOR_VISUAL_USER,
  NICKNAME_CONFLICT_USER,
  getPersona,
} from '@/mock/personas';

test('페르소나 레지스트리에 정의된 모든 페르소나는 필수 필드를 만족한다', () => {
  const personas = [
    NEW_SIGNUP_USER,
    WHEELCHAIR_USER,
    STROLLER_USER,
    SENIOR_VISUAL_USER,
    NICKNAME_CONFLICT_USER,
  ];

  for (const persona of personas) {
    assert.ok(persona.id, `${persona.name}에 id가 있어야 합니다.`);
    assert.ok(persona.name, `${persona.id}에 name이 있어야 합니다.`);
    assert.ok(persona.auth, `${persona.id}에 auth가 있어야 합니다.`);
    assert.ok(persona.profile, `${persona.id}에 profile이 있어야 합니다.`);
  }

  assert.equal(Object.keys(DEV_PERSONAS).length, 5);
});

test('getPersona는 키에 맞는 페르소나를 반환하고 미등록 키는 기본값을 반환한다', () => {
  assert.equal(getPersona('WHEELCHAIR_USER').id, 'wheelchair_user');
  assert.equal(getPersona('STROLLER_USER').id, 'stroller_user');
  // @ts-expect-error test unknown key fallback
  assert.equal(getPersona('UNKNOWN_KEY').id, 'new_signup_user');
});
