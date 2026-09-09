import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  appendPage,
  errorSnapshot,
  firstPageSnapshot,
  initialSnapshot,
  nextCursorToLoad,
  type PageSnapshot,
} from '../../src/myinfo/paginationState';

function snapshot(overrides: Partial<PageSnapshot<string>> = {}): PageSnapshot<string> {
  return {
    token: 0,
    state: 'success',
    items: ['a', 'b'],
    nextCursor: 'cursor-1',
    errorMessage: null,
    ...overrides,
  };
}

describe('paginationState — 첫 페이지', () => {
  it('초기 스냅샷은 아직 어떤 세대에도 속하지 않아 로딩으로 취급된다', () => {
    const initial = initialSnapshot<string>();

    assert.equal(initial.state, 'loading');
    assert.equal(initial.token, -1);
    assert.notEqual(initial.token, 0);
    assert.deepEqual(initial.items, []);
    assert.equal(initial.nextCursor, null);
  });

  it('첫 페이지는 항목을 교체하고 커서를 그대로 들고 온다', () => {
    const next = firstPageSnapshot(3, { items: ['x'], nextCursor: 'cursor-2' });

    assert.equal(next.token, 3);
    assert.equal(next.state, 'success');
    assert.deepEqual(next.items, ['x']);
    assert.equal(next.nextCursor, 'cursor-2');
  });

  it('실패 스냅샷은 항목과 커서를 비워 이전 페이지가 남지 않게 한다', () => {
    const next = errorSnapshot<string>(1, '불러오지 못했어요');

    assert.equal(next.state, 'error');
    assert.deepEqual(next.items, []);
    assert.equal(next.nextCursor, null);
    assert.equal(next.errorMessage, '불러오지 못했어요');
  });
});

describe('paginationState — 다음 페이지 이어붙이기', () => {
  it('요청한 커서와 세대가 맞으면 뒤에 이어 붙이고 커서를 갱신한다', () => {
    const next = appendPage(snapshot(), 0, 'cursor-1', { items: ['c'], nextCursor: 'cursor-2' });

    assert.deepEqual(next.items, ['a', 'b', 'c']);
    assert.equal(next.nextCursor, 'cursor-2');
    assert.equal(next.state, 'success');
  });

  it('마지막 페이지를 붙이면 커서가 null이 되어 더 요청하지 않는다', () => {
    const next = appendPage(snapshot(), 0, 'cursor-1', { items: ['c'], nextCursor: null });

    assert.equal(next.nextCursor, null);
    assert.equal(nextCursorToLoad(next, 0, null), null);
  });

  it('세대가 바뀐 뒤(새로고침·필터 변경) 늦게 온 응답은 버린다', () => {
    const current = snapshot({ token: 1, items: ['새 필터 결과'] });

    const next = appendPage(current, 1, 'cursor-1', { items: ['이전 필터 결과'], nextCursor: null });
    const stale = appendPage(current, 2, 'cursor-1', { items: ['이전 필터 결과'], nextCursor: null });

    assert.deepEqual(next.items, ['새 필터 결과', '이전 필터 결과']);
    // 세대 불일치면 원본 그대로 돌려준다.
    assert.equal(stale, current);
  });

  it('이미 커서가 넘어간 뒤 도착한 같은 페이지 응답은 중복으로 붙이지 않는다', () => {
    const alreadyAdvanced = snapshot({ nextCursor: 'cursor-2' });

    const result = appendPage(alreadyAdvanced, 0, 'cursor-1', { items: ['c'], nextCursor: 'cursor-3' });

    assert.equal(result, alreadyAdvanced);
    assert.deepEqual(result.items, ['a', 'b']);
  });
});

describe('paginationState — 다음 커서 판단', () => {
  it('커서가 있고 다른 요청이 없으면 그 커서를 돌려준다', () => {
    assert.equal(nextCursorToLoad(snapshot(), 0, null), 'cursor-1');
  });

  it('같은 커서를 이미 불러오는 중이면 중복 요청을 막는다', () => {
    assert.equal(nextCursorToLoad(snapshot(), 0, 'cursor-1'), null);
    // 다른 커서를 불러오는 중이라면 세대가 앞선 요청이므로 진행해도 된다.
    assert.equal(nextCursorToLoad(snapshot(), 0, 'cursor-0'), 'cursor-1');
  });

  it('마지막 페이지거나 첫 페이지가 아직 안 왔으면 요청하지 않는다', () => {
    assert.equal(nextCursorToLoad(snapshot({ nextCursor: null }), 0, null), null);
    assert.equal(nextCursorToLoad(initialSnapshot<string>(), 0, null), null);
    // 세대가 바뀌어 첫 페이지 재요청 중인 상태
    assert.equal(nextCursorToLoad(snapshot({ token: 0 }), 1, null), null);
  });
});
