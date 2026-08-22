import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type FilterChipsProps<T extends string> = {
  readonly options: readonly T[];
  readonly selected: T;
  readonly onSelect: (option: T) => void;
};

/** 내 제보 기록 · 내가 확인한 리포트 상단의 단일 선택 필터 칩 줄. */
export function FilterChips<T extends string>({ options, selected, onSelect }: FilterChipsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map(option => {
        const isSelected = option === selected;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
          >
            <Text
              color={isSelected ? colors.text.inverse : colors.text.primary}
              variant="body-3"
              weight={isSelected ? 'semibold' : 'medium'}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 100,
    // 선택 여부와 무관하게 테두리를 유지해 칩 폭이 변하지 않게 합니다.
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.brand.mainAlt,
    borderColor: colors.brand.mainAlt,
  },
  chipUnselected: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
  },
});
