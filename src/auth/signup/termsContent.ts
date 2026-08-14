/**
 * 백엔드 및 클라이언트 간 표준 약관 데이터 규격 (Schema)
 */

/** 약관 개별 조항 / 섹션 */
export interface TermSection {
  readonly id?: string;
  readonly title: string;
  readonly content: string;
  readonly items?: readonly string[];
}

/** 약관 상세 정보 DTO */
export interface TermDetail {
  readonly id: string;
  readonly bit: number;
  readonly title: string;
  readonly required: boolean;
  readonly version: string;
  readonly effectiveDate: string;
  readonly summary?: string;
  readonly sections: readonly TermSection[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

/** 활성 약관 목록 응답 DTO */
export interface TermsListResponse {
  readonly terms: readonly TermDetail[];
}
