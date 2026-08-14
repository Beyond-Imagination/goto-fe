import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';

import type { TermDetail } from '@/auth/signup/termsContent';
import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { FIGMA_SIGNUP_ASSETS } from '@/design/figmaSignupAssets';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';

interface TermsDetailModalProps {
  readonly visible: boolean;
  readonly term: TermDetail | null;
  readonly isAgreed?: boolean;
  readonly onClose: () => void;
  readonly onAgree: (term: TermDetail) => void;
}

export function TermsDetailModal({
  visible,
  term,
  isAgreed = false,
  onClose,
  onAgree,
}: TermsDetailModalProps) {
  if (!term) {
    return null;
  }

  const handleAgreeAndClose = () => {
    onAgree(term);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      hardwareAccelerated
      onRequestClose={onClose}
      statusBarTranslucent
      transparent={false}
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        {/* 모달 상단 헤더 */}
        <View style={styles.header}>
          <Pressable
            accessibilityHint="약관 상세 모달을 닫습니다."
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={styles.backButton}
          >
            <SvgUri height={14} style={styles.backIcon} uri={FIGMA_SIGNUP_ASSETS.arrowRight} width={18} />
          </Pressable>
          <Text
            color={colors.text.primary}
            numberOfLines={1}
            style={styles.headerTitle}
            variant="title-2"
            weight="semibold"
          >
            {term.title}
          </Text>
        </View>

        {/* 약관 본문 스크롤 영역 */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
        >
          {/* 메타 정보 뱃지 및 시행일자 */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                term.required ? styles.requiredBadge : styles.optionalBadge,
              ]}
            >
              <Text
                color={term.required ? colors.brand.mainAlt : colors.text.secondary}
                variant="caption-2"
                weight="semibold"
              >
                {term.required ? '필수' : '선택'}
              </Text>
            </View>
            <Text color={colors.text.tertiary} variant="caption-1">
              버전 {term.version} · 시행일자 {term.effectiveDate}
            </Text>
          </View>

          {/* 상단 요약 설명 박스 */}
          {term.summary ? (
            <View style={styles.summaryCard}>
              <Text color={colors.text.secondary} style={styles.summaryText} variant="body-3">
                {term.summary}
              </Text>
            </View>
          ) : null}

          {/* 조항별 상세 섹션 */}
          <View style={styles.sectionsList}>
            {term.sections.map((section, index) => (
              <View key={section.id ?? `${section.title}-${index}`} style={styles.sectionItem}>
                <Text
                  color={colors.text.primary}
                  style={styles.sectionTitle}
                  variant="body-2"
                  weight="semibold"
                >
                  {section.title}
                </Text>
                <Text
                  color={colors.text.secondary}
                  style={styles.sectionContent}
                  variant="body-3"
                >
                  {section.content}
                </Text>
                {section.items && section.items.length > 0 ? (
                  <View style={styles.subItemsList}>
                    {section.items.map((item, itemIdx) => (
                      <Text
                        color={colors.text.secondary}
                        key={itemIdx}
                        style={styles.subItemText}
                        variant="caption-1"
                      >
                        {item}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 하단 고정 액션 바 */}
        <BottomBar horizontalPadding={spacing[5]} showBorder>
          <PrimaryButton
            label={isAgreed ? '확인' : '동의하고 닫기'}
            onPress={handleAgreeAndClose}
            style={styles.actionButton}
          />
        </BottomBar>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border.regular,
    borderBottomWidth: 1,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  backButton: {
    left: spacing[5],
    padding: spacing[1],
    position: 'absolute',
    transform: [{ rotate: '180deg' }],
  },
  backIcon: {
    transform: [{ scaleY: -1 }],
  },
  headerTitle: {
    maxWidth: '75%',
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  requiredBadge: {
    backgroundColor: '#EEF2FF',
  },
  optionalBadge: {
    backgroundColor: colors.background.light,
  },
  summaryCard: {
    backgroundColor: colors.background.light,
    borderRadius: radius.md,
    marginBottom: spacing[6],
    padding: spacing[4],
  },
  summaryText: {
    lineHeight: 20,
  },
  sectionsList: {
    gap: spacing[6],
  },
  sectionItem: {
    gap: spacing[2],
  },
  sectionTitle: {
    lineHeight: 22,
  },
  sectionContent: {
    lineHeight: 22,
  },
  subItemsList: {
    backgroundColor: '#FAFAFB',
    borderRadius: radius.sm,
    gap: spacing[1.5],
    marginTop: spacing[1],
    padding: spacing[3],
  },
  subItemText: {
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: radius.lg,
    height: 58,
  },
});
