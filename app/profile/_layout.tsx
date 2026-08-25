import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';

import { ProfileStepLayout } from '@/screens/ProfileStepLayout';

const STEP_CONFIG = {
  mobility: {
    step: 1,
    title: '이동 방식 선택하기',
    subtitle: '해당되는 이동 방식을 모두 선택할 수 있어요',
    nextLabel: '다음',
    nextPath: '/profile/preference',
  },
  preference: {
    step: 2,
    title: '확인할 정보 고르기',
    subtitle: '우선 확인할 시설과 피하고 싶은 구간을 선택하세요.',
    nextLabel: '다음',
    nextPath: '/profile/display',
  },
  display: {
    step: 3,
    title: '보기와 알림 설정',
    subtitle: '사용자 맞춤 화면설정과 필요한 알림을 받을 수 있어요',
    nextLabel: '완료',
    nextPath: '/signup/complete',
  },
} as const;

export default function ProfileLayout() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.includes('/done')) {
    return <Slot />;
  }

  const currentStepKey = pathname.includes('preference')
    ? 'preference'
    : pathname.includes('display')
      ? 'display'
      : 'mobility';

  const config = STEP_CONFIG[currentStepKey];

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (currentStepKey === 'display') {
      router.replace('/signup/complete');
    } else {
      router.push(config.nextPath);
    }
  };

  const handleSkip = () => {
    router.replace('/signup/complete');
  };

  return (
    <ProfileStepLayout
      nextLabel={config.nextLabel}
      onBack={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      step={config.step}
      subtitle={config.subtitle}
      title={config.title}
    >
      <Slot />
    </ProfileStepLayout>
  );
}
