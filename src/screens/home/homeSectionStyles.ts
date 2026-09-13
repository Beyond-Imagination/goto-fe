import { StyleSheet } from "react-native";

import { spacing } from "@/styles/tokens/spacing";

// FarZoomContent/MidZoomContent/CloseZoomContent와 그 하위 섹션들이 공통으로 쓰는
// 바텀시트 섹션 레이아웃 — 각 파일에 똑같은 스타일을 복제하지 않도록 여기 하나로 둔다.
export const homeSectionStyles = StyleSheet.create({
  sectionHeading: {
    marginBottom: spacing[1]
  },
  sections: {
    gap: spacing[4]
  }
});
