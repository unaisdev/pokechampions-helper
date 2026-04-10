import '@src/shared/theme/unistyles-register';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text as ThemedText } from '@/components/Themed';
import { COLLABORATOR_SOCIAL_LINKS, DEVELOPER_SOCIAL_LINKS } from '@src/shared/config/social-links';
import { TabScreenContentFrame } from '@src/shared/ui/TabScreenContentFrame';

const POKEAPI_DOCS_URL = 'https://pokeapi.co/docs/v2';

/** Paleta inspirada en Pokédex / identidad Pokémon (rojo, amarillo, azul marco). */
const P = {
  red: '#DC2626',
  redDeep: '#991B1B',
  yellow: '#FFCB05',
  yellowInk: '#1c1917',
  blueFrame: '#1E3A5F',
  accentBar: '#FFCB05',
};

const DEVELOPER_SOCIAL_ITEMS = [
  {
    key: 'instagram' as const,
    url: DEVELOPER_SOCIAL_LINKS.instagram,
    icon: 'logo-instagram' as const,
  },
  { key: 'twitter' as const, url: DEVELOPER_SOCIAL_LINKS.twitter, icon: 'logo-twitter' as const },
  { key: 'github' as const, url: DEVELOPER_SOCIAL_LINKS.github, icon: 'logo-github' as const },
];

const COLLABORATOR_SOCIAL_ITEMS = [
  { key: 'twitch' as const, url: COLLABORATOR_SOCIAL_LINKS.twitch, icon: 'logo-twitch' as const },
  {
    key: 'youtube' as const,
    url: COLLABORATOR_SOCIAL_LINKS.youtube,
    icon: 'logo-youtube' as const,
  },
  { key: 'tiktok' as const, url: COLLABORATOR_SOCIAL_LINKS.tiktok, icon: 'logo-tiktok' as const },
  {
    key: 'instagram' as const,
    url: COLLABORATOR_SOCIAL_LINKS.instagram,
    icon: 'logo-instagram' as const,
  },
];

/** Grises fijos del Pokéball (identidad); no usar `theme.colors.background` en oscuro o el botón se funde con el fondo. */
const POKEBALL_LOWER = '#F4F4F5';
const POKEBALL_CENTER = '#FAFAFA';

function PokeballMark({ size = 52 }: { size?: number }) {
  const r = size / 2;
  const bandH = Math.max(3, Math.round(size * 0.09));
  const bandTop = r - bandH / 2;
  const btn = Math.round(size * 0.3);
  const btnR = btn / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        overflow: 'hidden',
        borderWidth: 2.5,
        borderColor: P.blueFrame,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: r,
          backgroundColor: P.red,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: r,
          backgroundColor: POKEBALL_LOWER,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: bandTop,
          left: 0,
          right: 0,
          height: bandH,
          backgroundColor: P.blueFrame,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: r - btnR,
          left: r - btnR,
          width: btn,
          height: btn,
          borderRadius: btnR,
          backgroundColor: POKEBALL_CENTER,
          borderWidth: 2.5,
          borderColor: P.blueFrame,
        }}
      />
    </View>
  );
}

export default function InfoTabScreen() {
  const { t } = useTranslation();
  const { theme, rt } = useUnistyles();
  const isDark = (rt.themeName ?? 'light') === 'dark';

  const pageBg = theme.colors.pageMuted;
  const cardBg = theme.colors.creamCard;
  const cardBorder = theme.colors.infoCardBorder;
  const sectionLabelColor = isDark ? P.yellow : P.redDeep;

  return (
    <TabScreenContentFrame outerBackgroundColor={pageBg}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: pageBg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <PokeballMark size={56} />
          <View style={styles.heroTextCol}>
            {/* <Text style={styles.heroTitle}>{t('info.title')}</Text> */}
            <View style={styles.taglinePill}>
              <Text style={styles.taglineText}>{t('info.heroTagline')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: pageBg }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardAccent, { backgroundColor: P.accentBar }]} />
          <ThemedText style={[styles.sectionTitle, { color: sectionLabelColor }]}>
            {t('info.whoTitle')}
          </ThemedText>
          <ThemedText style={styles.body}>{t('info.whoBody')}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardAccent, { backgroundColor: P.accentBar }]} />
          <ThemedText style={[styles.sectionTitle, { color: sectionLabelColor }]}>
            {t('info.whyTitle')}
          </ThemedText>
          <ThemedText style={styles.body}>{t('info.whyBody')}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardAccent, { backgroundColor: P.accentBar }]} />
          <ThemedText style={[styles.sectionTitle, { color: sectionLabelColor }]}>
            {t('info.audienceTitle')}
          </ThemedText>
          <ThemedText style={styles.body}>{t('info.audienceBody')}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardAccent, { backgroundColor: P.accentBar }]} />
          <ThemedText style={[styles.sectionTitle, { color: sectionLabelColor }]}>
            {t('info.developerTitle')}
          </ThemedText>
          <ThemedText style={styles.socialCredit}>{t('info.developerCredit')}</ThemedText>
          <View style={styles.socialRow}>
            {DEVELOPER_SOCIAL_ITEMS.map(({ key, url, icon }) => (
              <Pressable
                key={key}
                accessibilityRole="link"
                accessibilityLabel={t(`info.social.developer.${key}`)}
                onPress={() => Linking.openURL(url)}
                style={({ pressed }) => [
                  styles.socialPill,
                  {
                    backgroundColor: isDark ? '#29293d' : theme.colors.background,
                    borderColor: isDark ? P.red : theme.colors.infoCardBorder,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Ionicons name={icon} size={17} color={P.red} />
                <Text style={[styles.socialPillLabel, { color: isDark ? '#fafafa' : P.blueFrame }]}>
                  {t(`info.social.developer.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cardAccent, { backgroundColor: P.accentBar }]} />
          <ThemedText style={[styles.sectionTitle, { color: sectionLabelColor }]}>
            {t('info.collaboratorTitle')}
          </ThemedText>
          <ThemedText style={styles.socialCredit}>{t('info.collaboratorCredit')}</ThemedText>
          <View style={styles.socialRow}>
            {COLLABORATOR_SOCIAL_ITEMS.map(({ key, url, icon }) => (
              <Pressable
                key={key}
                accessibilityRole="link"
                accessibilityLabel={t(`info.social.collaborator.${key}`)}
                onPress={() => Linking.openURL(url)}
                style={({ pressed }) => [
                  styles.socialPill,
                  {
                    backgroundColor: isDark ? '#29293d' : theme.colors.background,
                    borderColor: isDark ? P.red : theme.colors.infoCardBorder,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Ionicons name={icon} size={17} color={P.red} />
                <Text style={[styles.socialPillLabel, { color: isDark ? '#fafafa' : P.blueFrame }]}>
                  {t(`info.social.collaborator.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.disclaimerPlain}>
          <Text style={[styles.disclaimerPlainTitle, { color: theme.colors.textMuted }]}>
            {t('info.disclaimerTitle')}
          </Text>
          <Text style={[styles.disclaimerPlainBody, { color: theme.colors.textSecondary }]}>
            {t('info.disclaimerBody')}
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('info.pokeapiDocs')}
            onPress={() => Linking.openURL(POKEAPI_DOCS_URL)}
            style={({ pressed }) => [styles.pokeapiLinkPlain, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.pokeapiLinkPlainText, { color: theme.colors.pokeapiLink }]}>
              {t('info.pokeapiDocs')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    </TabScreenContentFrame>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: P.red,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    overflow: 'hidden',
    borderBottomWidth: 5,
    borderBottomColor: P.yellow,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  heroTextCol: {
    flex: 1,
    gap: theme.space.md,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: theme.fontSize.display,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  taglinePill: {
    alignSelf: 'flex-start',
    backgroundColor: P.yellow,
    paddingHorizontal: theme.space.mdLg,
    paddingVertical: theme.space.smd,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: P.blueFrame,
  },
  taglineText: {
    color: P.yellowInk,
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  card: {
    borderRadius: theme.radius.hero,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: theme.radius.xl,
    borderBottomLeftRadius: theme.radius.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.heroLg,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: theme.space.smd,
    letterSpacing: 0.25,
  },
  body: {
    fontSize: theme.fontSize.title,
    lineHeight: 24,
  },
  socialCredit: {
    fontSize: theme.fontSize.caption,
    lineHeight: 18,
    marginBottom: theme.space.sm,
    opacity: 0.95,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
    marginTop: theme.space.xxs,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
  },
  socialPillLabel: {
    fontSize: theme.fontSize.caption,
    fontWeight: '600',
  },
  disclaimerPlain: {
    marginTop: theme.space.xs,
    paddingTop: theme.space.xs,
  },
  disclaimerPlainTitle: {
    fontSize: theme.fontSize.caption,
    fontWeight: '600',
    letterSpacing: 0.15,
    marginBottom: theme.space.smd,
  },
  disclaimerPlainBody: {
    fontSize: theme.fontSize.caption,
    lineHeight: 16,
    fontWeight: '400',
    marginBottom: theme.space.md,
  },
  pokeapiLinkPlain: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space.xxs,
  },
  pokeapiLinkPlainText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
}));
