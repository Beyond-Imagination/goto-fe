import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../theme";

/** ⓘ 아이콘과 함께 보조 설명을 보여주는 한 줄 안내. */
export function InfoNote({ children }: { children: string }) {
  return (
    <View style={styles.note}>
      <Text style={styles.icon}>ⓘ</Text>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: "row",
    gap: 8
  },
  icon: {
    ...typography.caption,
    color: colors.textDisabled
  },
  text: {
    ...typography.caption,
    color: colors.textDisabled,
    flex: 1
  }
});
