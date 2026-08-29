import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { InfoNote } from '@/components/onboarding/InfoNote';
import { Chip } from '@/components/onboarding/Selectors';
import { AVOID_CONDITIONS, MAX_SELECTION, PRIORITY_FACILITIES, useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';
export function PreferenceStepScreen() {
  const { profile, toggleFacility, toggleAvoid } = useProfile();

  return (
    <View style={styles.container}>
      <SectionTitle title="우선 확인 시설" />
      <View style={styles.chips}>
        {PRIORITY_FACILITIES.map((label) => (
          <Chip
            key={label}
            label={label}
            onPress={() => toggleFacility(label)}
            selected={profile.facilities.includes(label)}
            tone="blue"
          />
        ))}
      </View>

      <SectionTitle title="피하고 싶은 조건" />
      <View style={styles.chips}>
        {AVOID_CONDITIONS.map((label) => (
          <Chip
            key={label}
            label={label}
            onPress={() => toggleAvoid(label)}
            selected={profile.avoid.includes(label)}
            tone="orange"
          />
        ))}
      </View>

      <InfoNote>선택한 항목을 바탕으로 경로와 장소를 맞춤 제공해요</InfoNote>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="headline-2" weight="semibold">
        {title}
      </Text>
      <Text color={colors.text.secondary} variant="body-3">
        {`(최대 ${MAX_SELECTION}개)`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[8],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
});
