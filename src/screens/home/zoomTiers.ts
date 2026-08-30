/**
 * goto-be `ObstacleReportService`의 FAR_ZOOM_UPPER_BOUND/CLOSE_ZOOM_THRESHOLD와 반드시 같은 값을
 * 유지해야 한다 — 백엔드는 이 값으로 클러스터링 자체를 다르게 하고, 프론트는 이 값으로 어떤
 * 바텀시트 콘텐츠(요약 카드 / 주변 접근성 이슈 / 최근 제보)를 보여줄지 결정한다.
 * 둘 중 하나만 바뀌면 지도 마커와 바텀시트 내용이 어긋난다.
 */
export const FAR_ZOOM_UPPER_BOUND = 12;
export const CLOSE_ZOOM_THRESHOLD = 16;

export type ZoomTier = "far" | "mid" | "close";

export function getZoomTier(zoom: number): ZoomTier {
  if (zoom < FAR_ZOOM_UPPER_BOUND) {
    return "far";
  }
  if (zoom < CLOSE_ZOOM_THRESHOLD) {
    return "mid";
  }
  return "close";
}
