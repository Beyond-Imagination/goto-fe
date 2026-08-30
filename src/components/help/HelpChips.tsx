import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

import { helpChipPalette, helpDurationPalette } from './tokens';

type HelpKindChipsProps<T extends string> = {
  readonly options: readonly T[];
  readonly selected: readonly T[];
  readonly onToggle: (option: T) => void;
  readonly renderLabel: (option: T) => string;
};

/** 도움 유형 칩 — 복수 선택. */
export function HelpKindChips<T extends string>({
  options,
  selected,
  onToggle,
  renderLabel,
}: HelpKindChipsProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map(option => {
        const isSelected = selected.includes(option);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option}
            onPress={() => onToggle(option)}
            style={[
              styles.kindChip,
              // 선택 여부와 무관하게 테두리를 유지해 칩 폭이 변하지 않게 합니다.
              isSelected ? styles.kindChipSelected : styles.kindChipUnselected,
            ]}
          >
            <Text
              color={isSelected ? colors.text.inverse : helpChipPalette.unselectedText}
              variant="body-3"
              weight="medium"
            >
              {renderLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type DurationChipsProps = {
  readonly options: readonly number[];
  readonly value: number;
  readonly onChange: (minutes: number) => void;
};

/** 「10분 / 30분 / 60분 / 120분」 만료 시간 단일 선택. */
export function DurationChips({ options, value, onChange }: DurationChipsProps) {
  return (
    <View style={styles.durationRow}>
      {options.map(option => {
        const isSelected = option === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.durationChip,
              isSelected ? styles.durationChipSelected : styles.durationChipUnselected,
            ]}
          >
            <Text
              color={isSelected ? helpDurationPalette.selectedText : colors.text.primary}
              variant="body-3"
              weight={isSelected ? 'semibold' : 'medium'}
            >
              {option}분
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kindChip: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  kindChipSelected: {
    backgroundColor: helpChipPalette.selectedBackground,
    borderColor: helpChipPalette.selectedBackground,
  },
  kindChipUnselected: {
    backgroundColor: colors.background.primary,
    borderColor: helpChipPalette.unselectedBorder,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationChip: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  durationChipSelected: {
    backgroundColor: colors.background.primary,
    borderColor: helpDurationPalette.selectedBorder,
  },
  durationChipUnselected: {
    backgroundColor: colors.background.primary,
    borderColor: helpDurationPalette.unselectedBorder,
  },
});
