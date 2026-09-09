import { useRouter } from 'expo-router';

import { ObstacleReportFormScreen } from '@/screens/report/ObstacleReportFormScreen';

export default function ObstacleReportRoute() {
  const router = useRouter();

  return (
    <ObstacleReportFormScreen
      onBack={() => router.back()}
      onSubmitted={report => router.replace(`/report/done?kind=obstacle&id=${String(report.id)}`)}
    />
  );
}
