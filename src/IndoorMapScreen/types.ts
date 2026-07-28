import type { Coord } from "@mj-studio/react-native-naver-map";

import type { FacilityNode } from "../indoorMapApi";

export type IndoorMapScreenProps = {
  accessToken: string;
  placeId: number;
  placeName?: string;
};

export type Shape = {
  id: string;
  label?: string;
  category?: string;
  coords: Coord[];
};

export type MapData = { shapes: Shape[]; nodes: FacilityNode[] };
export type ScreenMode = "outdoor" | "indoor";

export type IndoorMapOverlaysProps = {
  shapes: Shape[];
  nodes: FacilityNode[];
  onNodePress: (node: FacilityNode) => void;
};
