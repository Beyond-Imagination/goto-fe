import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpPrimaryButton, HelpTag } from '@/components/help';
import { colors } from '@/styles/tokens/colors';

/** 완료 화면의 정보 카드 한 장 (와이어프레임 제보 07·08·09의 infoCard). */
export type ReportDoneCard = Readonly<{
  title: string;
  body: string | null;
  /** 제보 요약처럼 강조해야 하는 카드는 테두리를 진하게 씁니다. */
  emphasized?: boolean;
}>;

/**
 * 완료 화면에 필요한 내용 전부.
 * 제보 종류마다 문구·카드·버튼이 다른 별개 화면(제보 07·08·09)이라, 종류별 조립은
 * `src/report/reportDone.ts`가 하고 이 화면은 조립된 결과만 그립니다.
 */
export type ReportDoneSummary = Readonly<{
  id: number;
  heroTitle: string;
  heroSubtitle: string | null;
  /** 제보 종류를 나타내는 태그 (장애물 심각도 · 장소 이용 난이도 · 시설 이슈). */
  tagLabel: string;
  cards: readonly ReportDoneCard[];
  photoUrls: readonly string[];
  /** 「함께 만드는 안전한 길」 안내. */
  noticeTitle: string;
  noticeBody: string;
  /** 종류별 주 동작 (지도에서 보기 · 장소 상세 보기 · 실내 지도로 돌아가기). */
  primaryActionLabel: string;
}>;

type ReportDoneScreenProps = {
  readonly summary: ReportDoneSummary | null;
  readonly onClose: () => void;
  readonly onPrimaryAction: () => void;
  readonly onReportAgain: () => void;
};

/** 제보 07·08·09 — 제보 등록 완료. */
export function ReportDoneScreen({
  summary,
  onClose,
  onPrimaryAction,
  onReportAgain,
}: ReportDoneScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onClose} title="제보 등록 완료" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          {/* logo-mark.png는 스플래시용 흰색 마크라 브랜드 색으로 틴트해서 씁니다. */}
          <Image
            source={require('../../assets/logo-mark.png')}
            style={styles.logo}
            tintColor={colors.brand.mainAlt}
          />
          <Text color={colors.text.primary} style={styles.heroText} variant="title-1" weight="semibold">
            {summary?.heroTitle ?? '제보가 등록됐어요'}
          </Text>
          {summary?.heroSubtitle ? (
            <Text color={colors.text.secondary} style={styles.heroText} variant="body-1">
              {summary.heroSubtitle}
            </Text>
          ) : null}
        </View>

        {summary
          ? summary.cards.map((card, index) => (
              <View
                key={card.title}
                style={[styles.card, card.emphasized ? styles.cardEmphasized : null]}
              >
                <Text color={colors.text.primary} variant="body-1" weight="semibold">
                  {card.title}
                </Text>
                {card.body ? (
                  <Text color={colors.text.secondary} variant="body-3">
                    {card.body}
                  </Text>
                ) : null}
                {/* 제보 요약 카드에만 태그와 사진을 붙입니다. */}
                {index === 0 ? (
                  <View style={styles.cardMeta}>
                    <HelpTag label={summary.tagLabel} tone="distance" />
                    <Text color={colors.text.secondary} variant="body-3">
                      제보 ID {String(summary.id)}
                    </Text>
                  </View>
                ) : null}
                {index === 0 && summary.photoUrls.length > 0 ? (
                  <View style={styles.photoRow}>
                    {summary.photoUrls.map(url => (
                      <Image key={url} source={{ uri: url }} style={styles.photo} />
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          : null}

        {summary ? (
          <>
            <Text color={colors.text.primary} style={styles.sectionTitle} variant="body-1" weight="semibold">
              함께 만드는 안전한 길
            </Text>
            <View style={styles.notice}>
              <Text color={colors.text.secondary} variant="caption-1">
                ⓘ {summary.noticeTitle}
              </Text>
              <Text color={colors.text.disabled} style={styles.noticeBody} variant="caption-1">
                {summary.noticeBody}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <HelpPrimaryButton
          disabled={summary === null}
          label={summary?.primaryActionLabel ?? '지도에서 보기'}
          onPress={onPrimaryAction}
        />
        <HelpPrimaryButton label="추가 제보" onPress={onReportAgain} variant="secondary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    gap: 10,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logo: {
    height: 66,
    marginBottom: 10,
    resizeMode: 'contain',
    width: 66,
  },
  heroText: {
    textAlign: 'center',
  },
  card: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  cardEmphasized: {
    borderColor: colors.text.primary,
    borderWidth: 2,
  },
  cardMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photo: {
    borderRadius: 4,
    height: 64,
    width: 64,
  },
  sectionTitle: {
    marginTop: 12,
  },
  notice: {
    backgroundColor: colors.background.light,
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
  noticeBody: {
    marginLeft: 14,
  },
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
