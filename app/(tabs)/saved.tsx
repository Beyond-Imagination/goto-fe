import { useRouter } from 'expo-router';

import { SavedPlacesScreen } from '@/screens/saved/SavedPlacesScreen';

export default function SavedRoute() {
  const router = useRouter();

  // 장소 상세 화면이 아직 없어 카드 탭은 열지 않고, 빈 상태에서만 지도로 보냅니다.
  return <SavedPlacesScreen onOpenMap={() => router.push('/(tabs)/location')} />;
}
