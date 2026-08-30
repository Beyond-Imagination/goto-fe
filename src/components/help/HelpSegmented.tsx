import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type HelpSegmentedOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

type HelpSegmentedProps<T extends string> = {
  readonly options: readonly HelpSegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

/** 「장소 안에 있어요 / 길 위에 있어요」 2분할 토글. */
export function HelpSegmented<T extends string>({ options, value, onChange }: HelpSegmentedProps<T>) {
  return (
    <View style={styles.track}>
      {options.map(option => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isSelected ? styles.segmentSelected : null]}
          >
            <Text
              color={isSelected ? colors.text.primary : colors.text.tertiary}
              variant="body-3"
              weight="semibold"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.background.regular,
    borderRadius: 10,
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  segmentSelected: {
    backgroundColor: colors.background.primary,
  },
});
