import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { createMockMyInfoApi, resetMockMyInfoStore } from '@/myinfo/mockMyInfoApi';

describe('mockMyInfoApi', () => {
  beforeEach(() => {
    resetMockMyInfoStore();
  });

  it('저장한 설정은 어댑터를 새로 만들어도 남아 있다', async () => {
    const saving = createMockMyInfoApi();
    const before = await saving.getSettings();

    await saving.updateSettings({
      notifications: { ...before.notifications, savedPlaceStatusChange: false },
      display: { ...before.display, largeText: true },
    });

    // 화면을 다시 열면 어댑터가 새로 생성됩니다.
    const reopened = createMockMyInfoApi();
    const after = await reopened.getSettings();

    assert.equal(after.notifications.savedPlaceStatusChange, false);
    assert.equal(after.display.largeText, true);
    // 건드리지 않은 스위치는 기본값(켜짐) 그대로입니다.
    assert.equal(after.notifications.myHelpRequestAccepted, true);
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

describe('mockMyInfoApi — 커서 페이지네이션', () => {
  it('내 제보 기록은 분류를 합쳐 최신순으로 돌려준다', async () => {
    const api = createMockMyInfoApi();

    const page = await api.findMyReportPage();

    assert.equal(page.nextCursor, null);
    assert.deepEqual(
      page.items.map(item => item.kind),
      ['FACILITY', 'PLACE', 'OBSTACLE', 'OBSTACLE', 'OBSTACLE'],
    );
    // kind에 해당하는 본문만 채워진다.
    assert.notEqual(page.items[0]?.facility, null);
    assert.equal(page.items[0]?.obstacle, null);
    assert.equal(page.items[0]?.place, null);
  });

  it('kind를 주면 그 분류만 돌려준다', async () => {
    const api = createMockMyInfoApi();

    const page = await api.findMyReportPage({ kind: 'PLACE' });

    assert.equal(page.items.length, 1);
    assert.equal(page.items[0]?.kind, 'PLACE');
  });

  it('size로 끊고 nextCursor로 이어 읽으면 모든 제보를 한 번씩만 받는다', async () => {
    const api = createMockMyInfoApi();
    const seen: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < 10; page += 1) {
      const result = await api.findMyReportPage({ cursor, size: 2 });
      assert.ok(result.items.length <= 2);
      for (const item of result.items) {
        const body = item.obstacle ?? item.place ?? item.facility;
        seen.push(`${item.kind}#${String(body?.id)}`);
      }
      cursor = result.nextCursor;
      if (cursor === null) {
        break;
      }
    }

    assert.equal(cursor, null);
    assert.equal(seen.length, 5);
    assert.equal(new Set(seen).size, 5);
  });

  it('확인 기록도 status 필터와 커서로 끊어 읽는다', async () => {
    const api = createMockMyInfoApi();

    const first = await api.findMyConfirmedReportPage({ size: 2 });
    assert.equal(first.items.length, 2);
    assert.ok(first.nextCursor !== null);

    const second = await api.findMyConfirmedReportPage({ cursor: first.nextCursor, size: 2 });
    assert.equal(second.items.length, 1);
    assert.equal(second.nextCursor, null);

    const resolvedOnly = await api.findMyConfirmedReportPage({ status: 'RESOLVED' });
    assert.ok(resolvedOnly.items.length > 0);
    assert.ok(resolvedOnly.items.every(item => item.report.status === 'RESOLVED'));
  });
});
