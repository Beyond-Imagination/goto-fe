import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// useHelpRequestApi(모드 분기)는 AuthProvider를 거쳐 react-native를 끌어와서
// node 테스트 러너로는 불러올 수 없습니다. 여기서는 어댑터 동작만 검증합니다.
import { createMockHelpRequestApi, resetMockHelpRequestStore } from '@/help/mockHelpRequestApi';

describe('mockHelpRequestApi', () => {
  beforeEach(() => {
    resetMockHelpRequestStore();
  });

  it('기본 시드로 대기 중인 요청 두 건을 들고 시작한다', async () => {
    const api = createMockHelpRequestApi();

    const mine = await api.findMine();

    assert.equal(mine.length, 2);
    assert.ok(mine.every(request => request.status === 'PENDING'));
    assert.equal((await api.countPending()).pendingCount, 2);
  });

  it('요청을 만들면 목록·상세·대기 카운트에 함께 반영된다', async () => {
    const api = createMockHelpRequestApi();
    const before = await api.countPending();

    const created = await api.create({
      locationLabel: '경주역 3번 출구',
      latitude: 35.8562,
      longitude: 129.2245,
      kinds: ['ELEVATOR_CALL'],
      message: '엘리베이터 버튼을 눌러주세요',
      expiresInMinutes: 30,
    });

    assert.equal(created.status, 'PENDING');
    assert.equal(created.locationLabel, '경주역 3번 출구');
    assert.deepEqual(created.kinds, ['ELEVATOR_CALL']);
    assert.equal((await api.get(created.id)).id, created.id);
    assert.equal((await api.countPending()).pendingCount, before.pendingCount + 1);
    // 최신 요청이 목록 맨 앞에 온다.
    assert.equal((await api.findMine())[0]?.id, created.id);
  });

  it('만료 시각은 요청한 분만큼 뒤로 잡힌다', async () => {
    const api = createMockHelpRequestApi();

    const created = await api.create({
      locationLabel: '만료 테스트',
      latitude: 35.83,
      longitude: 129.22,
      kinds: ['OTHER'],
      expiresInMinutes: 30,
    });

    const remainingMinutes = (new Date(created.expiresAt).getTime() - Date.now()) / 60_000;
    assert.ok(remainingMinutes > 29 && remainingMinutes <= 30, `remaining=${String(remainingMinutes)}`);
  });

  it('주변 목록은 수락 전 좌표를 소수점 3자리로 뭉갠 근사 좌표만 준다', async () => {
    const api = createMockHelpRequestApi();

    const nearby = await api.findNearby({ latitude: 35.834, longitude: 129.2265 });
    const target = nearby.find(request => request.id === 'mock-help-1');
    const exact = await api.get('mock-help-1');

    assert.ok(target);
    assert.equal(target.approximateLatitude, 35.834);
    assert.equal(target.approximateLongitude, 129.226);
    // 정확 좌표(소수점 4자리 이상)는 상세 조회에만 있다.
    assert.equal(exact.latitude, 35.834);
    assert.notEqual(nearby.find(request => request.id === 'mock-help-2')?.approximateLongitude, 129.2249);
  });

  it('수락하면 상태와 도우미가 채워지고 주변 목록에서 빠진다', async () => {
    const api = createMockHelpRequestApi();

    const accepted = await api.accept('mock-help-1');

    assert.equal(accepted.status, 'ACCEPTED');
    assert.ok(accepted.acceptedAt);
    assert.ok(accepted.helperNickname);
    assert.equal((await api.findNearby({ latitude: 35.834, longitude: 129.2265 })).length, 1);
    assert.equal((await api.countPending()).pendingCount, 1);
  });

  it('수락 취소는 다시 대기 상태로 되돌린다', async () => {
    const api = createMockHelpRequestApi();
    await api.accept('mock-help-1');

    const reopened = await api.cancelAccept('mock-help-1');

    assert.equal(reopened.status, 'PENDING');
    assert.equal(reopened.acceptedAt, null);
    assert.equal(reopened.helperNickname, null);
  });

  it('완료·취소는 각각의 시각을 남긴다', async () => {
    const api = createMockHelpRequestApi();

    const completed = await api.complete('mock-help-1');
    const canceled = await api.cancel('mock-help-2');

    assert.equal(completed.status, 'COMPLETED');
    assert.ok(completed.completedAt);
    assert.equal(canceled.status, 'CANCELED');
    assert.ok(canceled.canceledAt);
    // 둘 다 대기 상태가 아니라 주변 목록이 비워진다.
    assert.equal((await api.findNearby({ latitude: 35.834, longitude: 129.2265 })).length, 0);
  });

  it('거절한 요청은 그 도우미 목록에서 사라진다', async () => {
    const api = createMockHelpRequestApi();

    await api.reject('mock-help-2');

    await assert.rejects(() => api.get('mock-help-2'), /요청 정보를 불러오지 못했어요/);
    assert.equal((await api.findMine()).length, 1);
  });

  it('없는 요청을 조회하면 화면이 에러 상태를 띄울 수 있게 실패한다', async () => {
    const api = createMockHelpRequestApi();

    await assert.rejects(() => api.get('없는-요청'), /요청 정보를 불러오지 못했어요/);
  });

  it('상태 변화는 어댑터를 새로 만들어도 남아 있다', async () => {
    await createMockHelpRequestApi().accept('mock-help-1');

    const other = createMockHelpRequestApi();

    assert.equal((await other.get('mock-help-1')).status, 'ACCEPTED');
  });

  it('시설 연락처는 긴급 연락처와 주변 장소를 함께 준다', async () => {
    const api = createMockHelpRequestApi();

    const contacts = await api.findPlaceContacts();

    assert.equal(contacts.emergencyContact.telephone, '119');
    assert.equal(contacts.placeContacts.length, 2);
    // 연락처가 없는 장소도 섞어 두어 「연락처 없음」 표시를 확인할 수 있게 합니다.
    assert.deepEqual(
      contacts.placeContacts.map(place => place.contactAvailable),
      [true, false],
    );
  });
});
