import assert from "node:assert/strict";
import test from "node:test";

import {
  isContentScrollEnabled,
  bottomSheetSnap,
  nativeVelocityForSnap,
  selectSnap,
  translateYFor
} from "../src/components/common/bottomSheet/bottomSheet.logic.ts";

test("unselected map sheet initially exposes 33 percent of its container", () => {
  assert.ok(Math.abs(translateYFor(bottomSheetSnap.peek, 1000) - 670) < 0.001);
});

test("sheet content scrolls only when the sheet is expanded", () => {
  assert.equal(isContentScrollEnabled(bottomSheetSnap.collapsed), false);
  assert.equal(isContentScrollEnabled(bottomSheetSnap.peek), false);
  assert.equal(isContentScrollEnabled(bottomSheetSnap.expanded), true);
});

test("expanded sheet settles at peek after a short slow downward drag", () => {
  assert.equal(
    selectSnap(bottomSheetSnap.expanded, 1000, 100, 0),
    bottomSheetSnap.peek
  );
});

test("expanded sheet stays expanded without downward movement", () => {
  assert.equal(
    selectSnap(bottomSheetSnap.expanded, 1000, 0, 0),
    bottomSheetSnap.expanded
  );
});

test("expanded sheet settles at peek after a downward fling", () => {
  assert.equal(
    selectSnap(bottomSheetSnap.expanded, 1000, 100, 0.8),
    bottomSheetSnap.peek
  );
});

test("expanded sheet cannot close from a deep slow downward drag", () => {
  assert.equal(
    selectSnap(bottomSheetSnap.expanded, 1000, 900, 0),
    bottomSheetSnap.peek
  );
});

test("peek sheet closes after a slow downward drag below 15 percent", () => {
  assert.equal(
    selectSnap(bottomSheetSnap.peek, 1000, 900, 0),
    bottomSheetSnap.collapsed
  );
});

test("native pan velocity preserves the snap fling threshold unit", () => {
  assert.equal(nativeVelocityForSnap(-800), -0.8);
  assert.equal(nativeVelocityForSnap(800), 0.8);
});
