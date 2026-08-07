import { StyleSheet, View } from "react-native";

import { InfoNote } from "../components/InfoNote";
import { MobilityCard } from "../components/Selectors";
import { MOBILITY_OPTIONS, useProfile } from "../state/profile";
import { ProfileStepLayout } from "./ProfileStepLayout";

const COLUMNS = 3;

type MobilityStepScreenProps = {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function MobilityStepScreen({ onBack, onNext, onSkip }: MobilityStepScreenProps) {
  const { profile, toggleMobility } = useProfile();

  const rows = chunk(MOBILITY_OPTIONS, COLUMNS);

  return (
    <ProfileStepLayout
      nextLabel="다음"
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
      step={1}
      subtitle="해당되는 이동 방식을 모두 선택할 수 있어요"
      title="이동 방식 선택하기"
    >
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((option) => (
              <MobilityCard
                icon={option.icon}
                key={option.id}
                label={option.label}
                onPress={() => toggleMobility(option.id)}
                selected={profile.mobility.includes(option.id)}
              />
            ))}
          </View>
        ))}
      </View>

      <InfoNote>선택한 정보는 경로추천과 위험안내, 시설확인에 활용되요</InfoNote>
    </ProfileStepLayout>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }

  return rows;
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
    marginBottom: 20,
    marginTop: 28
  },
  row: {
    flexDirection: "row",
    gap: 12
  }
});
