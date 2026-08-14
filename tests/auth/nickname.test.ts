import assert from 'node:assert/strict';
import test from 'node:test';

import { getNicknameFormatMessage, isValidNickname, normalizeNickname } from '@/auth/signup/nickname';

test('닉네임은 앞뒤 공백을 제거한 한글·영문·숫자 2~12자만 허용한다', () => {
  assert.equal(normalizeNickname('  Goto12  '), 'Goto12');
  assert.equal(isValidNickname('함께가길'), true);
  assert.equal(isValidNickname('Goto12'), true);
  assert.equal(isValidNickname('가'), false);
  assert.equal(isValidNickname('goto-name'), false);
  assert.equal(isValidNickname('1234567890123'), false);
});

test('닉네임 형식 오류는 사용자가 고칠 수 있는 메시지를 반환한다', () => {
  assert.equal(getNicknameFormatMessage(''), '닉네임을 입력해주세요.');
  assert.equal(getNicknameFormatMessage('goto-name'), '닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.');
  assert.equal(getNicknameFormatMessage('Goto12'), null);
});
