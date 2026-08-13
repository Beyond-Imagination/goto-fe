export const REQUIRED_AGREEMENT_MASK = 15;
export const ALL_AGREEMENT_MASK = 31;

export const SIGNUP_AGREEMENTS = [
  { bit: 1, id: 'age', label: '만 14세 이상입니다. (필수)' },
  { bit: 2, id: 'terms', label: '서비스 이용약관에 동의합니다. (필수)' },
  { bit: 4, id: 'privacy', label: '개인정보 수집 및 이용에 동의합니다. (필수)' },
  { bit: 8, id: 'location', label: '위치 기반 서비스 이용약관에 동의합니다. (필수)' },
  { bit: 16, id: 'marketing', label: '마케팅 정보 수신에 동의합니다. (선택)' },
] as const;

export function toggleAgreement(mask: number, bit: number): number {
  return mask & bit ? mask & ~bit : mask | bit;
}

export function hasRequiredAgreements(mask: number): boolean {
  return (mask & REQUIRED_AGREEMENT_MASK) === REQUIRED_AGREEMENT_MASK;
}
