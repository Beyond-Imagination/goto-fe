import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildDummyClusters } from '@/dummyObstacleClusters';

// 시청·광화문·종로 세 무리를 모두 포함하는 넓은 bbox.
const WIDE_BBOX = { minLat: 37.55, minLng: 126.95, maxLat: 37.6, maxLng: 127.02 };
// 시청 광장 무리만 들어오는 좁은 bbox.
const CITY_HALL_BBOX = { minLat: 37.5645, minLng: 126.9755, maxLat: 37.5685, maxLng: 126.98 };

describe('buildDummyClusters', () => {
  it('가까운 줌(>=16)은 제보 1건 = 클러스터 1개이고 id가 채워진다', () => {
    const clusters = buildDummyClusters(CITY_HALL_BBOX, 17);
    assert.ok(clusters.length >= 5);
    for (const cluster of clusters) {
      assert.equal(cluster.reportCount, 1);
      assert.notEqual(cluster.id, null);
      assert.ok(cluster.topIssueTypes[0]);
    }
  });

  it('가까운 줌은 사진 없음(null)·빈 문자열·깨진 URL 케이스를 모두 포함한다', () => {
    const clusters = buildDummyClusters(CITY_HALL_BBOX, 17);
    assert.ok(clusters.some((cluster) => cluster.photoUrls === null));
    assert.ok(clusters.some((cluster) => cluster.photoUrls?.[0] === ''));
    assert.ok(clusters.some((cluster) => cluster.photoUrls?.[0]?.includes('invalid.example')));
  });

  it('중간·먼 줌은 묶이더라도 전체 제보 수가 보존된다', () => {
    const closeTotal = buildDummyClusters(WIDE_BBOX, 17).length;
    for (const zoom of [14, 10]) {
      const clusters = buildDummyClusters(WIDE_BBOX, zoom);
      assert.equal(clusters.reduce((sum, cluster) => sum + cluster.reportCount, 0), closeTotal);
      assert.ok(clusters.length < closeTotal, `zoom ${String(zoom)}에서 묶여야 한다`);
    }
  });

  it('중간 줌은 nearbyPlaceLabel이 채워지고, 클러스터(2건 이상)는 id·photoUrls가 null이다', () => {
    const clusters = buildDummyClusters(WIDE_BBOX, 14);
    assert.ok(clusters.every((cluster) => cluster.nearbyPlaceLabel !== null));
    const grouped = clusters.filter((cluster) => cluster.reportCount > 1);
    assert.ok(grouped.length > 0);
    for (const cluster of grouped) {
      assert.equal(cluster.id, null);
      assert.equal(cluster.photoUrls, null);
    }
  });

  it('bbox 밖 제보는 제외한다', () => {
    assert.deepEqual(buildDummyClusters({ minLat: 0, minLng: 0, maxLat: 1, maxLng: 1 }, 17), []);
  });
});
