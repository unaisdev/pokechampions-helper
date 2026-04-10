import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { modalCardSizingStyle } from '@src/shared/lib/modal-layout';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import { persistUserTheme } from '@src/shared/theme/theme-preference';

const LANG_OPTIONS = [
  { code: 'es' as const, flag: '🇪🇸' },
  { code: 'en' as const, flag: '🇬🇧' },
  { code: 'ja' as const, flag: '🇯🇵' },
] as const;

const THEME_MODES = ['light', 'dark'] as const;

export type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, rt } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();
  const wideCardSizing = useMemo(() => modalCardSizingStyle(windowWidth), [windowWidth]);
  const activeTheme: 'light' | 'dark' = rt.themeName === 'dark' ? 'dark' : 'light';

  return (
    <BackdropModal visible={visible} onClose={onClose}>
      <View style={styles.modalBody}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, wideCardSizing]}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('settings.title')}</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeIconBtn}
                accessibilityRole="button"
                accessibilityLabel={t('settings.closeA11y')}
              >
                <Ionicons name="close" size={28} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="contrast-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.sectionLabel}>{t('theme.label')}</Text>
              </View>
              <View style={styles.chipRow}>
                {THEME_MODES.map((mode) => {
                  const active = activeTheme === mode;
                  return (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => void persistUserTheme(mode)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Ionicons
                        name={mode === 'light' ? 'sunny' : 'moon'}
                        size={20}
                        color={active ? theme.colors.oursAccent : theme.colors.textSecondary}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {t(`theme.${mode}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="language-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.sectionLabel}>{t('language.label')}</Text>
              </View>
              <View style={styles.chipRow}>
                {LANG_OPTIONS.map(({ code, flag }) => {
                  const active = i18n.language.startsWith(code);
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => void i18n.changeLanguage(code)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={styles.flag}>{flag}</Text>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {t(`language.${code}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </BackdropModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.space.xl,
    pointerEvents: 'box-none',
  },
  scroll: {
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: theme.space.sm,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.space.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space.xl,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.screenTitle,
    fontWeight: '700',
    color: theme.colors.text,
    flexShrink: 1,
  },
  closeIconBtn: {
    padding: theme.space.xs,
    marginLeft: theme.space.sm,
  },
  section: {
    marginBottom: theme.space.xl,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginBottom: theme.space.md,
  },
  sectionLabel: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.smd,
    paddingHorizontal: theme.space.mdLg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.background,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.oursBgSoft,
  },
  chipText: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.oursAccent,
  },
  flag: {
    fontSize: 22,
    lineHeight: 26,
  },
}));
