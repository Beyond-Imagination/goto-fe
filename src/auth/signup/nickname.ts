const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9]{2,12}$/;

export function normalizeNickname(value: string): string {
  return value.trim();
}

export function isValidNickname(value: string): boolean {
  return NICKNAME_PATTERN.test(normalizeNickname(value));
}

export function getNicknameFormatMessage(value: string): string | null {
  if (!normalizeNickname(value)) {
    return '닉네임을 입력해주세요.';
  }

  return isValidNickname(value) ? null : '닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.';
}
