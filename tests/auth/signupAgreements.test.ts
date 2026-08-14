import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_AGREEMENT_MASK,
  hasRequiredAgreements,
  REQUIRED_AGREEMENT_MASK,
  toggleAgreement,
} from '@/auth/signup/signupAgreements';

test('필수 약관에 모두 동의하면 백엔드 필수 마스크가 된다', () => {
  // Given: 약관 마스크가 비어 있다.
  let mask = 0;

  // When: 필수 비트 1, 2, 4, 8을 켠다.
  for (const bit of [1, 2, 4, 8]) {
    mask = toggleAgreement(mask, bit);
  }

  // Then: REQUIRED_AGREEMENT_MASK가 되고, 마케팅 동의가 있어도 필수는 충족한다.
  assert.equal(mask, REQUIRED_AGREEMENT_MASK);
  assert.equal(hasRequiredAgreements(mask), true);
  assert.equal(hasRequiredAgreements(mask | 16), true);
});

test('선택 마케팅 동의는 필수 약관을 깨지 않고 켜고 끌 수 있다', () => {
  // Given: 필수 약관에 모두 동의한 상태다.
  // When: 마케팅 동의 비트를 켰다가 끈다.
  const withMarketing = toggleAgreement(REQUIRED_AGREEMENT_MASK, 16);

  // Then: 켠 뒤에는 전체 마스크이고, 끈 뒤에는 다시 필수 마스크만 남는다.
  assert.equal(withMarketing, ALL_AGREEMENT_MASK);
  assert.equal(hasRequiredAgreements(withMarketing), true);
  assert.equal(toggleAgreement(withMarketing, 16), REQUIRED_AGREEMENT_MASK);
});
