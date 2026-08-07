import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType
} from "react-native";

import { colors, radius, typography } from "../theme";

type ChipTone = "blue" | "orange";

type ChipProps = {
  label: string;
  selected: boolean;
  tone: ChipTone;
  onPress: () => void;
};

/** 접근성 프로필의 다중 선택 칩. tone에 따라 우선 확인 시설 / 피하고 싶은 조건을 구분합니다. */
export function Chip({ label, selected, tone, onPress }: ChipProps) {
  const palette = tone === "blue" ? BLUE : ORANGE;

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
          : { backgroundColor: colors.white, borderColor: palette.border },
        pressed ? styles.pressed : null
      ]}
    >
      <Text style={[styles.chipLabel, { color: selected ? colors.white : palette.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

type MobilityCardProps = {
  label: string;
  icon: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
};

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
        pressed ? styles.pressed : null
      ]}
    >
      <Image
        resizeMode="contain"
        source={icon}
        style={[styles.cardIcon, { tintColor: selected ? colors.white : colors.iconMuted }]}
      />
      <Text style={[styles.cardLabel, selected ? styles.cardLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

type ToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
};

/** ON/OFF 텍스트를 함께 노출하는 스위치. 색상만으로 상태를 전달하지 않기 위한 디자인 원칙 5번. */
export function Toggle({ value, onValueChange, label }: ToggleProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
    >
      {value ? <Text style={styles.toggleText}>ON</Text> : null}
      <View style={styles.knob} />
      {value ? null : <Text style={styles.toggleText}>OFF</Text>}
    </Pressable>
  );
}

type SettingRowProps = {
  icon: ImageSourcePropType;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

export function SettingRow({ icon, title, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <Image resizeMode="contain" source={icon} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Toggle label={title} onValueChange={onValueChange} value={value} />
    </View>
  );
}

const BLUE = {
  solid: colors.primary,
  border: colors.chipBlueBorder,
  text: colors.chipBlueText
};

const ORANGE = {
  solid: colors.accent,
  border: colors.chipOrangeBorder,
  text: colors.chipOrangeText
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75
  },
  chip: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 13
  },
  chipLabel: {
    ...typography.chip
  },
  card: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.card,
    flex: 1,
    gap: 10,
    justifyContent: "center"
  },
  cardSelected: {
    backgroundColor: colors.primary
  },
  cardIcon: {
    height: 44,
    width: 44
  },
  cardLabel: {
    ...typography.caption,
    color: colors.text
  },
  cardLabelSelected: {
    color: colors.white
  },
  toggle: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    height: 28,
    justifyContent: "space-between",
    paddingHorizontal: 3,
    width: 56
  },
  toggleOn: {
    backgroundColor: colors.toggleOn
  },
  toggleOff: {
    backgroundColor: colors.toggleOff
  },
  toggleText: {
    ...typography.toggleLabel,
    color: colors.white,
    paddingHorizontal: 4
  },
  knob: {
    backgroundColor: colors.white,
    borderRadius: 11,
    height: 22,
    width: 22
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12
  },
  rowIcon: {
    height: 40,
    width: 40
  },
  rowText: {
    flex: 1,
    gap: 2
  },
  rowTitle: {
    ...typography.rowTitle,
    color: colors.text
  },
  rowDescription: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
