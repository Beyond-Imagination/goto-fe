import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SavedPlaceResponse } from '@/saved/savedPlaceApi';
import {
  applyNotification,
  initialSavedSnapshot,
  insertPlaceAt,
  loadedSavedSnapshot,
  removePlace,
  replacePlace,
  savedErrorSnapshot,
  settledView,
} from '@/saved/savedListState';

function place(placeId: number, overrides: Partial<SavedPlaceResponse> = {}): SavedPlaceResponse {
  return {
    placeId,
    name: `장소 ${placeId}`,
    category: null,
    address: null,
    thumbnailUrl: null,
    latitude: null,
    longitude: null,
    hasIndoorMap: false,
    isAvailable: true,
    savedAt: '2026-09-01T00:00:00Z',
    notificationEnabled: true,
    latestAccessStatus: null,
    latestReportedAt: null,
    ...overrides,
  };
}

const PLACES = [place(1), place(2), place(3)];

describe('savedListState — 조회', () => {
  it('처음에는 로딩이고, 아직 어느 세대의 결과도 아니다', () => {
    const snapshot = initialSavedSnapshot();

    assert.equal(snapshot.state, 'loading');
    assert.equal(snapshot.token, -1);
    assert.deepEqual(snapshot.places, []);
  });

  it('실패 스냅샷은 목록을 비우고 메시지를 남긴다', () => {
    const snapshot = savedErrorSnapshot(0, '불러오지 못했어요');

    assert.equal(snapshot.state, 'error');
    assert.deepEqual(snapshot.places, []);
    assert.equal(snapshot.errorMessage, '불러오지 못했어요');
  });

  it('세대가 다른 스냅샷은 화면에서 로딩으로 취급한다', () => {
    const stale = loadedSavedSnapshot(0, PLACES);

    assert.equal(settledView(stale, 0).state, 'success');
    assert.equal(settledView(stale, 1).state, 'loading');
    assert.deepEqual(settledView(stale, 1).places, []);
  });
});

describe('savedListState — 알림 스위치', () => {
  it('해당 장소만 바꾸고 나머지는 그대로 둔다', () => {
    const next = applyNotification(loadedSavedSnapshot(0, PLACES), 0, 2, false);

    assert.deepEqual(
      next.places.map(item => [item.placeId, item.notificationEnabled]),
      [
        [1, true],
        [2, false],
        [3, true],
      ],
    );
  });

  it('되돌리기는 같은 함수로 반대 값을 적용하면 원래대로 돌아온다', () => {
    const loaded = loadedSavedSnapshot(0, PLACES);
    const optimistic = applyNotification(loaded, 0, 2, false);
    const reverted = applyNotification(optimistic, 0, 2, true);

    assert.deepEqual(reverted.places, loaded.places);
  });

  it('세대가 바뀌면(목록이 새로 도착) 늦게 온 결과가 덮어쓰지 않는다', () => {
    const loaded = loadedSavedSnapshot(1, PLACES);

    assert.equal(applyNotification(loaded, 0, 2, false), loaded);
    assert.equal(replacePlace(loaded, 0, place(2, { notificationEnabled: false })), loaded);
    assert.equal(removePlace(loaded, 0, 2), loaded);
    assert.equal(insertPlaceAt(loaded, 0, place(9), 0), loaded);
  });

  it('서버 응답으로 항목을 덮어쓴다', () => {
    const next = replacePlace(
      loadedSavedSnapshot(0, PLACES),
      0,
      place(2, {
        notificationEnabled: false,
        latestAccessStatus: 'INACCESSIBLE',
      }),
    );

    assert.equal(next.places[1].notificationEnabled, false);
    assert.equal(next.places[1].latestAccessStatus, 'INACCESSIBLE');
    assert.equal(next.places[0].notificationEnabled, true);
  });

  it('목록에 없는 장소의 응답은 새로 끼워 넣지 않는다', () => {
    const next = replacePlace(loadedSavedSnapshot(0, PLACES), 0, place(99));

    assert.equal(next.places.length, 3);
  });
});

describe('savedListState — 저장 해제', () => {
  it('해제한 장소만 빠진다', () => {
    const next = removePlace(loadedSavedSnapshot(0, PLACES), 0, 2);

    assert.deepEqual(
      next.places.map(item => item.placeId),
      [1, 3],
    );
  });

  it('실패하면 원래 자리로 되돌아온다 — 최근 저장순이 뒤바뀌지 않게', () => {
    const loaded = loadedSavedSnapshot(0, PLACES);
    const removed = removePlace(loaded, 0, 2);
    const restored = insertPlaceAt(removed, 0, PLACES[1], 1);

    assert.deepEqual(
      restored.places.map(item => item.placeId),
      [1, 2, 3],
    );
  });

  it('이미 같은 장소가 있으면 두 번 끼워 넣지 않는다', () => {
    const loaded = loadedSavedSnapshot(0, PLACES);

    assert.equal(insertPlaceAt(loaded, 0, PLACES[1], 1), loaded);
  });

  it('되돌릴 자리가 목록 범위를 벗어나도 끝에 붙인다', () => {
    const next = insertPlaceAt(loadedSavedSnapshot(0, PLACES), 0, place(9), 99);

    assert.deepEqual(
      next.places.map(item => item.placeId),
      [1, 2, 3, 9],
    );
  });
});
