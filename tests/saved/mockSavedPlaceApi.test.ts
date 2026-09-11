import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { createMockSavedPlaceApi, resetMockSavedPlaceStore } from '@/saved/mockSavedPlaceApi';
import { SavedPlaceApiError } from '@/saved/savedPlaceApi';

describe('mockSavedPlaceApi', () => {
  beforeEach(() => {
    resetMockSavedPlaceStore();
  });

  it('저장 목록은 최근 저장한 순서로 온다', async () => {
    const places = await createMockSavedPlaceApi().findMine();

    const savedAtDescending = places.every(
      (place, index) =>
        index === 0 || Date.parse(places[index - 1].savedAt) >= Date.parse(place.savedAt),
    );

    assert.ok(places.length > 0);
    assert.ok(savedAtDescending);
  });

  it('알림을 끄면 어댑터를 새로 만들어도 꺼진 상태가 남아 있다', async () => {
    const api = createMockSavedPlaceApi();
    const [first] = await api.findMine();

    const updated = await api.updateNotification(first.placeId, false);
    assert.equal(updated.notificationEnabled, false);

    // 화면을 다시 열면 어댑터가 새로 생성됩니다.
    const reopened = await createMockSavedPlaceApi().findMine();
    const target = reopened.find(place => place.placeId === first.placeId);

    assert.equal(target?.notificationEnabled, false);
  });

  it('알림 설정은 그 장소에만 적용된다', async () => {
    const api = createMockSavedPlaceApi();
    const before = await api.findMine();
    const [first, second] = before;

    await api.updateNotification(first.placeId, false);
    const after = await api.findMine();

    assert.equal(after.find(place => place.placeId === first.placeId)?.notificationEnabled, false);
    assert.equal(
      after.find(place => place.placeId === second.placeId)?.notificationEnabled,
      second.notificationEnabled,
    );
  });

  it('저장하지 않은 장소의 알림을 바꾸면 실서버와 같은 404 오류가 난다', async () => {
    await assert.rejects(
      () => createMockSavedPlaceApi().updateNotification(999_999, false),
      (error: unknown) => {
        assert.ok(error instanceof SavedPlaceApiError);
        assert.equal(error.status, 404);
        assert.equal(error.errorCode, 'SAVED_PLACE_NOT_FOUND');
        return true;
      },
    );
  });

  it('같은 장소를 두 번 저장해도 목록에 하나만 남는다', async () => {
    const api = createMockSavedPlaceApi();
    const before = (await api.findMine()).length;

    await api.save(555);
    await api.save(555);
    const after = await api.findMine();

    assert.equal(after.length, before + 1);
    assert.equal(after.filter(place => place.placeId === 555).length, 1);
  });

  it('새로 저장한 장소는 알림이 켜진 채로 맨 앞에 온다', async () => {
    const api = createMockSavedPlaceApi();

    await api.save(555);
    const places = await api.findMine();

    assert.equal(places[0].placeId, 555);
    assert.equal(places[0].notificationEnabled, true);
  });

  it('저장을 해제하면 목록에서 사라지고, 해제한 장소를 다시 해제해도 실패하지 않는다', async () => {
    const api = createMockSavedPlaceApi();
    const [first] = await api.findMine();

    await api.unsave(first.placeId);
    await api.unsave(first.placeId);

    const places = await api.findMine();
    assert.equal(
      places.some(place => place.placeId === first.placeId),
      false,
    );
  });

  it('해제한 장소를 다시 저장하면 알림 설정은 기본값(켜짐)으로 돌아온다', async () => {
    const api = createMockSavedPlaceApi();
    const target = (await api.findMine()).find(place => !place.notificationEnabled);
    assert.ok(target, '알림이 꺼진 시드 장소가 있어야 이 시나리오를 검증할 수 있습니다');

    await api.unsave(target.placeId);
    await api.save(target.placeId);

    const places = await api.findMine();
    assert.equal(places.find(place => place.placeId === target.placeId)?.notificationEnabled, true);
  });

  it('목록을 바꿔도 반환된 배열을 손대면 저장소가 오염되지 않는다', async () => {
    const api = createMockSavedPlaceApi();
    const places = await api.findMine();

    (places as unknown as { notificationEnabled: boolean }[])[0].notificationEnabled = false;

    const reread = await api.findMine();
    assert.equal(reread[0].notificationEnabled, true);
  });
});
