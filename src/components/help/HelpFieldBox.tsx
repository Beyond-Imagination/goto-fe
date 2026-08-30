import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';
import { fontFamily, fontSize } from '@/styles/tokens/typography';

type HelpFieldBoxProps = {
  readonly label: string;
  readonly required?: boolean;
  readonly placeholder: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly multiline?: boolean;
  readonly keyboardType?: 'default' | 'number-pad';
};

/** 라벨이 박스 안 위쪽에 붙는 입력 필드. */
export function HelpFieldBox({
  label,
  required = false,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: HelpFieldBoxProps) {
  return (
    <View style={[styles.box, multiline ? styles.boxMultiline : null]}>
      <View style={styles.labelRow}>
        <Text color={colors.text.tertiary} variant="caption-1">
          {label}
        </Text>
        {required ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="caption-1">
            *
          </Text>
        ) : null}
      </View>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    paddingBottom: 13,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  boxMultiline: {
    minHeight: 104,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 2,
  },
  input: {
    color: colors.text.primary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-2'].fontSize,
    letterSpacing: fontSize['body-2'].letterSpacing,
    lineHeight: fontSize['body-2'].lineHeight,
    marginTop: 4,
    padding: 0,
  },
  inputMultiline: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
});
