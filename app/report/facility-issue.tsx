import { useRouter } from 'expo-router';

import { FacilityReportFormScreen } from '@/screens/report/FacilityReportFormScreen';

export default function FacilityReportRoute() {
  const router = useRouter();

  return (
    <FacilityReportFormScreen
      onBack={() => router.back()}
      onSubmitted={report => router.replace(`/report/done?kind=facility&id=${String(report.id)}`)}
    />
  );
}
