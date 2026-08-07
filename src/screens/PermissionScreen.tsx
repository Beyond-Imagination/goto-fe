import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomBar, PrimaryButton, SkipLink } from "../components/Buttons";
import { InfoNote } from "../components/InfoNote";
import { ScreenHeader } from "../components/ScreenHeader";
import { colors, spacing, typography } from "../theme";

type Permission = {
  icon: ImageSourcePropType;
  title: string;
  description: string;
};

const PERMISSIONS: Permission[] = [
  {
    icon: require("../assets/perm-notification.png"),
    title: "알림 (선택)",
    description: "저장한 장소의 상태변화 알림"
  },
  {
    icon: require("../assets/perm-location.png"),
    title: "위치 (선택)",
    description: "내 주변 장소와 장애물 리포트 제공"
  },
  {
    icon: require("../assets/perm-camera.png"),
    title: "카메라 (선택)",
    description: "장애물 리포트 제보시 사용"
  },
  {
    icon: require("../assets/perm-photo.png"),
    title: "사진 (선택)",
    description: "장애물 리포트 제보시 사용"
  }
];

type PermissionScreenProps = {
  onBack: () => void;
  onConfirm: () => void;
  onSkip: () => void;
};

export function PermissionScreen({ onBack, onConfirm, onSkip }: PermissionScreenProps) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader onBack={onBack} title="필수 권한 설정" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{"앱 사용을 위해\n접근 권한을 허용해주세요"}</Text>

        <View style={styles.list}>
          {PERMISSIONS.map((permission) => (
            <View key={permission.title} style={styles.row}>
              <Image resizeMode="contain" source={permission.icon} style={styles.icon} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{permission.title}</Text>
                <Text style={styles.rowDescription}>{permission.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <InfoNote>사용자의 동의 없이 개인정보를 수집하거나 공유하지 않습니다.</InfoNote>
      </ScrollView>

      <BottomBar>
        <PrimaryButton label="확인" onPress={onConfirm} />
        <SkipLink onPress={onSkip} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: spacing.screenX,
    paddingTop: 8
  },
  title: {
    ...typography.screenTitle,
    color: colors.text
  },
  list: {
    gap: 28,
    marginTop: 36
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18
  },
  icon: {
    height: 28,
    width: 28
  },
  rowText: {
    flex: 1,
    gap: 4
  },
  rowTitle: {
    ...typography.rowTitle,
    color: colors.text
  },
  rowDescription: {
    ...typography.caption,
    color: colors.textSecondary
  },
  divider: {
    backgroundColor: colors.lineRegular,
    height: 1,
    marginBottom: 20,
    marginTop: 36
  }
});
