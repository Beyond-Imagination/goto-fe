import { Stack } from 'expo-router';

/** 내 정보 탭 안의 스택. 하위 화면에서도 탭바가 유지되도록 탭 안에 중첩합니다. */
export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        headerShown: false,
      }}
    />
  );
}
