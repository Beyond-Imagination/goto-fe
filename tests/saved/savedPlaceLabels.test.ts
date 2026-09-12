import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SavedPlaceResponse } from '@/saved/savedPlaceApi';
import {
  RECENT_CHANGE_DAYS,
  STALE_DAYS,
  countNotificationEnabled,
  emptyFilterMessage,
  filterSavedPlaces,
  toLastCheckedLabel,
  toSavedPlaceCard,
} from '@/saved/savedPlaceLabels';

const NOW = Date.parse('2026-09-09T00:00:00Z');
const DAY_MS = 86_400_000;

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY_MS).toISOString();
}

function place(overrides: Partial<SavedPlaceResponse> = {}): SavedPlaceResponse {
  return {
    placeId: 1,
    name: '테스트 장소',
    category: '공원',
    address: '서울 성동구 뚝섬로 273',
    thumbnailUrl: null,
    latitude: 37.5,
    longitude: 127,
    hasIndoorMap: false,
    isAvailable: true,
    savedAt: daysAgo(10),
    notificationEnabled: true,
    latestAccessStatus: 'ACCESSIBLE',
    latestReportedAt: daysAgo(1),
    ...overrides,
  };
}

describe('toSavedPlaceCard', () => {
  it('카테고리와 주소를 한 줄로 합친다', () => {
    const card = toSavedPlaceCard(place(), NOW);

    assert.equal(card.subtitle, '공원 · 서울 성동구 뚝섬로 273');
  });

  it('카테고리나 주소가 없으면 있는 쪽만 쓰고, 둘 다 없으면 null이다', () => {
    assert.equal(
      toSavedPlaceCard(place({ category: null }), NOW).subtitle,
      '서울 성동구 뚝섬로 273',
    );
    assert.equal(toSavedPlaceCard(place({ address: null }), NOW).subtitle, '공원');
    assert.equal(toSavedPlaceCard(place({ category: '  ', address: null }), NOW).subtitle, null);
  });

  it('상태는 문구와 톤을 함께 준다 — 색만으로 판단하지 않도록', () => {
    assert.deepEqual(
      [
        toSavedPlaceCard(place({ latestAccessStatus: 'ACCESSIBLE' }), NOW),
        toSavedPlaceCard(place({ latestAccessStatus: 'PARTIALLY_ACCESSIBLE' }), NOW),
        toSavedPlaceCard(place({ latestAccessStatus: 'INACCESSIBLE' }), NOW),
        toSavedPlaceCard(place({ latestAccessStatus: null, latestReportedAt: null }), NOW),
      ].map(card => [card.statusLabel, card.statusTone]),
      [
        ['이용 편함', 'green'],
        ['일부 주의', 'amber'],
        ['이용 어려움', 'red'],
        ['상태 제보 없음', 'muted'],
      ],
    );
  });

  it('알림 스위치 값과 실내 지도 여부를 그대로 전달한다', () => {
    const card = toSavedPlaceCard(place({ notificationEnabled: false, hasIndoorMap: true }), NOW);

    assert.equal(card.notificationEnabled, false);
    assert.equal(card.hasIndoorMap, true);
  });
});

describe('toLastCheckedLabel', () => {
  it('오늘 올라온 제보는 「오늘 확인」이다', () => {
    assert.equal(toLastCheckedLabel(daysAgo(0), NOW), '오늘 확인');
  });

  it('지난 제보는 며칠 전인지 알려준다', () => {
    assert.equal(toLastCheckedLabel(daysAgo(3), NOW), '3일 전 확인');
    assert.equal(toLastCheckedLabel(daysAgo(45), NOW), '45일 전 확인');
  });

  it('제보가 없거나 시각을 읽을 수 없으면 확인 기록이 없다고 말한다', () => {
    assert.equal(toLastCheckedLabel(null, NOW), '확인 기록 없음');
    assert.equal(toLastCheckedLabel('not-a-date', NOW), '확인 기록 없음');
  });

  it('시계 차이로 미래 시각이 와도 「오늘 확인」으로 떨어진다', () => {
    assert.equal(toLastCheckedLabel(new Date(NOW + DAY_MS).toISOString(), NOW), '오늘 확인');
  });
});

describe('filterSavedPlaces', () => {
  const recent = place({
    placeId: 1,
    latestReportedAt: daysAgo(2),
    latestAccessStatus: 'ACCESSIBLE',
  });
  const caution = place({
    placeId: 2,
    latestReportedAt: daysAgo(20),
    latestAccessStatus: 'PARTIALLY_ACCESSIBLE',
  });
  const blocked = place({
    placeId: 3,
    latestReportedAt: daysAgo(40),
    latestAccessStatus: 'INACCESSIBLE',
  });
  const never = place({
    placeId: 4,
    latestReportedAt: null,
    latestAccessStatus: null,
  });
  const all = [recent, caution, blocked, never];

  it('「전체」는 목록을 그대로 돌려준다', () => {
    assert.equal(filterSavedPlaces(all, '전체', NOW), all);
  });

  it('「변화」는 최근에 상태 제보가 올라온 곳만 남긴다', () => {
    const ids = filterSavedPlaces(all, '변화', NOW).map(item => item.placeId);

    assert.deepEqual(ids, [1]);
  });

  it('「주의」는 일부 주의·이용 어려움만 남긴다', () => {
    const ids = filterSavedPlaces(all, '주의', NOW).map(item => item.placeId);

    assert.deepEqual(ids, [2, 3]);
  });

  it('「오래됨」은 확인이 오래된 곳과 아직 확인되지 않은 곳을 남긴다', () => {
    const ids = filterSavedPlaces(all, '오래됨', NOW).map(item => item.placeId);

    assert.deepEqual(ids, [3, 4]);
  });

  it('경계값 — 변화는 7일까지, 오래됨은 30일부터', () => {
    const boundary = [
      place({ placeId: 11, latestReportedAt: daysAgo(RECENT_CHANGE_DAYS) }),
      place({ placeId: 12, latestReportedAt: daysAgo(RECENT_CHANGE_DAYS + 1) }),
      place({ placeId: 13, latestReportedAt: daysAgo(STALE_DAYS) }),
      place({ placeId: 14, latestReportedAt: daysAgo(STALE_DAYS - 1) }),
    ];

    assert.deepEqual(
      filterSavedPlaces(boundary, '변화', NOW).map(item => item.placeId),
      [11],
    );
    assert.deepEqual(
      filterSavedPlaces(boundary, '오래됨', NOW).map(item => item.placeId),
      [13],
    );
  });

  it('필터별 빈 목록 안내는 서로 다른 문구다', () => {
    const messages = new Set(
      (['전체', '변화', '주의', '오래됨'] as const).map(filter => emptyFilterMessage(filter)),
    );

    assert.equal(messages.size, 4);
  });
});

describe('countNotificationEnabled', () => {
  it('알림이 켜진 저장 장소만 센다', () => {
    const count = countNotificationEnabled([
      place({ placeId: 1, notificationEnabled: true }),
      place({ placeId: 2, notificationEnabled: false }),
      place({ placeId: 3, notificationEnabled: true }),
    ]);

    assert.equal(count, 2);
  });
});
