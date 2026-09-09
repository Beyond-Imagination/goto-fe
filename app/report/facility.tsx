import { useRouter } from 'expo-router';

import { FacilityPickerScreen } from '@/screens/report/FacilityPickerScreen';

export default function FacilityPickerRoute() {
  const router = useRouter();

  return (
    <FacilityPickerScreen
      onBack={() => router.back()}
      onNext={() => router.push('/report/facility-issue')}
    />
  );
}
