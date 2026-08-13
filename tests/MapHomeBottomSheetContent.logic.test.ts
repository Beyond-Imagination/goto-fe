import assert from "node:assert/strict";
import test from "node:test";

import {
  getMapHomeBottomSheetSelectionData,
  mapHomeBottomSheetFixtureData,
  mapHomeBottomSheetItemKey,
  mapHomeBottomSheetSelection,
  mapHomeBottomSheetSelectionKind
} from "@/screens/home/mapHomeBottomSheetContent";

test("home map content supplies stable FlatList keys", () => {
  const data = getMapHomeBottomSheetSelectionData({
    data: mapHomeBottomSheetFixtureData.facility,
    kind: mapHomeBottomSheetSelectionKind.facility
  });

  assert.equal(data.items.length, 12);
  assert.equal(new Set(data.items.map(mapHomeBottomSheetItemKey)).size, data.items.length);
});

test("home map starts with the empty content state", () => {
  const data = getMapHomeBottomSheetSelectionData(mapHomeBottomSheetSelection.empty);

  assert.equal(data.id, "empty");
  assert.equal(data.items[0]?.id, "empty-selection");
});
