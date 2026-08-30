import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTLY_VIEWED_PLACES_STORAGE_KEY = 'goto.places.recently-viewed';
const MAX_RECENTLY_VIEWED_PLACES = 10;

export type RecentlyViewedPlace = {
  readonly placeId: number;
  readonly name: string;
  readonly thumbnailUrl: string | null;
};

export async function getRecentlyViewedPlaces(): Promise<RecentlyViewedPlace[]> {
  const raw = await AsyncStorage.getItem(RECENTLY_VIEWED_PLACES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as RecentlyViewedPlace[]) : [];
  } catch {
    return [];
  }
}

/** 장소를 최근 조회 목록 맨 앞에 기록한다. 이미 있던 항목이면 앞으로 옮기고, 최대 개수를 넘으면 오래된 항목부터 잘라낸다. */
export async function recordPlaceView(place: RecentlyViewedPlace): Promise<void> {
  const current = await getRecentlyViewedPlaces();
  const withoutDuplicate = current.filter((entry) => entry.placeId !== place.placeId);
  const next = [place, ...withoutDuplicate].slice(0, MAX_RECENTLY_VIEWED_PLACES);

  await AsyncStorage.setItem(RECENTLY_VIEWED_PLACES_STORAGE_KEY, JSON.stringify(next));
}
