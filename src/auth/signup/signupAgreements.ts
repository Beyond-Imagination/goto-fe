export const REQUIRED_AGREEMENT_MASK = 15;
export const ALL_AGREEMENT_MASK = 31;

export const SIGNUP_AGREEMENTS = [
  { bit: 1, id: 'age', label: '(필수) 만 14세 이상입니다' },
  { bit: 2, id: 'terms', label: '(필수) 서비스 이용약관' },
  { bit: 4, id: 'privacy', label: '(필수) 개인정보 수집 및 이용' },
  { bit: 8, id: 'location', label: '(필수) 위치기반서비스 이용약관' },
  { bit: 16, id: 'marketing', label: '(선택) 마케팅 정보 수신' },
] as const;

export function toggleAgreement(mask: number, bit: number): number {
  return mask & bit ? mask & ~bit : mask | bit;
}

export function hasRequiredAgreements(mask: number): boolean {
  return (mask & REQUIRED_AGREEMENT_MASK) === REQUIRED_AGREEMENT_MASK;
}
