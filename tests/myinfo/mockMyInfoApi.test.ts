import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { createMockMyInfoApi, resetMockMyInfoStore } from '../../src/myinfo/mockMyInfoApi';

describe('mockMyInfoApi', () => {
  beforeEach(() => {
    resetMockMyInfoStore();
  });

  it('저장한 설정은 어댑터를 새로 만들어도 남아 있다', async () => {
    const saving = createMockMyInfoApi();
    const before = await saving.getSettings();

    await saving.updateSettings({
      notifications: { ...before.notifications, savedPlaceStatusChange: true },
      display: { ...before.display, largeText: true },
    });

    // 화면을 다시 열면 어댑터가 새로 생성됩니다.
    const reopened = createMockMyInfoApi();
    const after = await reopened.getSettings();

    assert.equal(after.notifications.savedPlaceStatusChange, true);
    assert.equal(after.display.largeText, true);
    assert.equal(after.notifications.myHelpRequestAccepted, false);
  });

  it('저장한 접근성 프로필도 어댑터를 새로 만들어도 남아 있다', async () => {
    await createMockMyInfoApi().updatePreferences({
      mobilityModes: ['STROLLER'],
      priorityFacilities: ['RAMP'],
      avoidConditions: [],
    });

    const preferences = await createMockMyInfoApi().getPreferences();

    assert.deepEqual(preferences.mobilityModes, ['STROLLER']);
    assert.deepEqual(preferences.priorityFacilities, ['RAMP']);
    assert.deepEqual(preferences.avoidConditions, []);
  });

  it('프로필 요약의 이동 방식은 저장된 접근성 프로필을 따른다', async () => {
    await createMockMyInfoApi().updatePreferences({
      mobilityModes: ['WALK'],
      priorityFacilities: [],
      avoidConditions: [],
    });

    const profile = await createMockMyInfoApi().getProfile();

    assert.deepEqual(profile.mobilityModes, ['WALK']);
  });
});
