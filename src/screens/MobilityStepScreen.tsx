import { StyleSheet, View } from 'react-native';

import { InfoNote } from '@/components/onboarding/InfoNote';
import { MobilityCard } from '@/components/onboarding/Selectors';
import { MOBILITY_OPTIONS, useProfile } from '@/state/profile';
import { spacing } from '@/styles/tokens/spacing';
const COLUMNS = 3;

export function MobilityStepScreen() {
  const { profile, toggleMobility } = useProfile();

  const rows = chunk(MOBILITY_OPTIONS, COLUMNS);

  return (
    <View style={styles.container}>
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
    </View>
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
  container: {
    flex: 1,
  },
  grid: {
    gap: spacing[3],
    marginBottom: spacing[5],
    marginTop: spacing[7],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
});
