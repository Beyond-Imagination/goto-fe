import { useRouter } from 'expo-router';

import { ReportHomeScreen } from '@/screens/report/ReportHomeScreen';

export default function ReportRoute() {
  const router = useRouter();

  return (
    <ReportHomeScreen
      onOpenMyReports={() => router.push('/profile/reports')}
      onStartReport={() => router.push('/report/kind')}
    />
  );
}
