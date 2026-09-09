import { useRouter } from 'expo-router';

import { PlaceStateReportFormScreen } from '@/screens/report/PlaceStateReportFormScreen';

export default function PlaceStateReportRoute() {
  const router = useRouter();

  return (
    <PlaceStateReportFormScreen
      onBack={() => router.back()}
      onSubmitted={report => router.replace(`/report/done?kind=place&id=${String(report.id)}`)}
    />
  );
}
