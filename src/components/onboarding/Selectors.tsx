import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Text } from '@/components/common/Text';
import {
  MOBILITY_ICON_MUTED,
  chipPalette,
  togglePalette,
} from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';

interface ChipProps {
  label: string;
  selected: boolean;
  tone: keyof typeof chipPalette;
  onPress: () => void;
}

/** 접근성 프로필의 다중 선택 칩. tone에 따라 우선 확인 시설 / 피하고 싶은 조건을 구분합니다. */
export function Chip({ label, selected, tone, onPress }: ChipProps) {
  const palette = chipPalette[tone];

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        // 선택 여부와 관계없이 테두리를 유지해야 폭이 안 바뀌고 옆 칩이 밀리지 않습니다.
        selected
          ? { backgroundColor: palette.solid, borderColor: palette.solid }
          : { backgroundColor: colors.background.primary, borderColor: palette.border },
        pressed ? styles.pressed : null,
      ]}
    >
      <Text color={selected ? colors.text.inverse : palette.text} variant="body-3" weight="medium">
        {label}
      </Text>
    </Pressable>
  );
}

interface MobilityCardProps {
  label: string;
  icon: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
}

/** 이동 방식 선택 카드. 아이콘은 단색 마스크라 tintColor로 상태 색을 입힙니다. */
export function MobilityCard({ label, icon, selected, onPress }: MobilityCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Image
        resizeMode="contain"
        source={icon}
        style={[
          styles.cardIcon,
          { tintColor: selected ? colors.icon.inverse : MOBILITY_ICON_MUTED },
        ]}
      />
      <Text color={selected ? colors.text.inverse : colors.text.primary} variant="body-3">
        {label}
      </Text>
    </Pressable>
  );
}

interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
}

/** ON/OFF 텍스트를 함께 노출하는 스위치. 색상만으로 상태를 전달하지 않기 위한 디자인 원칙 5번. */
export function Toggle({ value, onValueChange, label }: ToggleProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.toggle, { backgroundColor: value ? togglePalette.on : togglePalette.off }]}
    >
      {value ? (
        <Text color={colors.text.inverse} style={styles.toggleText} variant="caption-3" weight="semibold">
          ON
        </Text>
      ) : null}
      <View style={styles.knob} />
      {value ? null : (
        <Text color={colors.text.inverse} style={styles.toggleText} variant="caption-3" weight="semibold">
          OFF
        </Text>
      )}
    </Pressable>
  );
}

interface SettingRowProps {
  icon: ImageSourcePropType;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

export function SettingRow({ icon, title, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <Image resizeMode="contain" source={icon} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text color={colors.text.primary} variant="body-1" weight="semibold">
          {title}
        </Text>
        <Text color={colors.text.secondary} variant="body-3">
          {description}
        </Text>
      </View>
      <Toggle label={title} onValueChange={onValueChange} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  chip: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  card: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.background.light,
    borderRadius: radius.xl,
    flex: 1,
    gap: spacing[2.5],
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: colors.brand.mainAlt,
  },
  cardIcon: {
    height: 44,
    width: 44,
  },
  toggle: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    height: 28,
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    width: 56,
  },
  toggleText: {
    paddingHorizontal: spacing[1],
  },
  knob: {
    backgroundColor: colors.neutral[0],
    borderRadius: 11,
    height: 22,
    width: 22,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  rowIcon: {
    height: 40,
    width: 40,
  },
  rowText: {
    flex: 1,
    gap: spacing[0.5],
  },
});
