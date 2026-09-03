import { useRouter } from 'expo-router';

import { FacilityContactScreen } from '@/screens/help/FacilityContactScreen';

export default function ContactFacilityRoute() {
  const router = useRouter();

  return <FacilityContactScreen onBack={() => router.back()} />;
}
