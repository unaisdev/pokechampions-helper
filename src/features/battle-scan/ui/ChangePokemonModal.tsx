import '@src/shared/theme/unistyles';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { modalCardSizingStyle } from '@src/shared/lib/modal-layout';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import { formatPokemonSlugAsTitle, normalizePokemonNameQuery } from '@src/shared/lib/pokemon-name';

export type ChangePokemonModalProps = {
  visible: boolean;
  onClose: () => void;
  currentSlug: string;
  /** e.g. "Nuestro equipo — posición 1" */
  contextLabel: string;
  variant: 'ours' | 'rival';
  onLoadFormSlugs: (slug: string) => Promise<string[]>;
  onApplySlug: (newSlug: string) => void;
};

export function ChangePokemonModal({
  visible,
  onClose,
  currentSlug,
  contextLabel,
  variant,
  onLoadFormSlugs,
  onApplySlug,
}: ChangePokemonModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();
  const wideCardSizing = useMemo(() => modalCardSizingStyle(windowWidth), [windowWidth]);
  const [formSlugs, setFormSlugs] = useState<string[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSearch('');
    setSearchError(null);
    setLoadingForms(true);
    setFormSlugs([]);
    let cancelled = false;
    void (async () => {
      try {
        const slugs = await onLoadFormSlugs(currentSlug);
        if (!cancelled) {
          setFormSlugs(slugs);
        }
      } finally {
        if (!cancelled) {
          setLoadingForms(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, currentSlug, onLoadFormSlugs]);

  const accent =
    variant === 'ours'
      ? {
          border: theme.colors.primary,
          chipBg: theme.colors.oursBgSoft,
          chipBorder: theme.colors.oursBorderSoft,
        }
      : {
          border: theme.colors.rivalAccentStrong,
          chipBg: theme.colors.rivalBgSoft,
          chipBorder: theme.colors.rivalBorderSoft,
        };

  const showVariantSection = !loadingForms && formSlugs.length > 1;

  const pickForm = (slug: string) => {
    onApplySlug(slug);
    onClose();
  };

  const submitSearch = () => {
    const key = normalizePokemonNameQuery(search);
    if (!key) {
      setSearchError(t('changePokemon.searchEmpty'));
      return;
    }
    setSearchError(null);
    onApplySlug(key);
    onClose();
  };

  return (
    <BackdropModal visible={visible} onClose={onClose}>
      <View style={styles.modalBody}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, wideCardSizing, { borderTopColor: accent.border }]}>
            <Text style={styles.title}>{t('changePokemon.title')}</Text>
            <Text style={styles.context}>{contextLabel}</Text>
            <Text style={styles.hint}>{t('changePokemon.hint')}</Text>

            {loadingForms ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>{t('changePokemon.loadingForms')}</Text>
              </View>
            ) : null}

            {showVariantSection ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('changePokemon.formsLabel')}</Text>
                {formSlugs.map((slug) => {
                  const selected = slug === currentSlug;
                  return (
                    <Pressable
                      key={slug}
                      style={[
                        styles.formChip,
                        { backgroundColor: accent.chipBg, borderColor: accent.chipBorder },
                        selected && styles.formChipSelected,
                      ]}
                      onPress={() => pickForm(slug)}
                    >
                      <Text style={[styles.formChipText, selected && styles.formChipTextSelected]}>
                        {formatPokemonSlugAsTitle(slug)}
                        {selected ? t('changePokemon.currentSuffix') : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('changePokemon.searchLabel')}</Text>
              <Text style={styles.searchHint}>{t('changePokemon.searchHint')}</Text>
              <TextInput
                style={styles.input}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  setSearchError(null);
                }}
                placeholder={t('changePokemon.searchPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={submitSearch}
              />
              {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
              <Pressable style={styles.primaryBtn} onPress={submitSearch}>
                <Text style={styles.primaryBtnText}>{t('changePokemon.searchApply')}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t('changePokemon.close')}</Text>
            </Pressable>
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
    borderTopWidth: 4,
    borderTopColor: 'transparent',
  },
  title: {
    fontSize: theme.fontSize.screenTitle,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.space.xs,
  },
  context: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.space.md,
  },
  hint: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: theme.space.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginBottom: theme.space.lg,
  },
  loadingText: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  section: {
    marginBottom: theme.space.xl,
  },
  sectionLabel: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.space.sm,
  },
  formChip: {
    paddingVertical: theme.space.mdLg,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.space.sm,
  },
  formChipSelected: {
    borderWidth: 2,
  },
  formChipText: {
    fontSize: theme.fontSize.titleSm,
    fontWeight: '600',
    color: theme.colors.textInk,
  },
  formChipTextSelected: {
    color: theme.colors.text,
  },
  searchHint: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.textMuted,
    marginBottom: theme.space.sm,
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.mdLg,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    fontSize: theme.fontSize.titleSm,
    marginBottom: theme.space.sm,
    color: theme.colors.text,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSize.body,
    marginBottom: theme.space.sm,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.space.mdLg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: theme.fontSize.titleSm,
  },
  closeBtn: {
    alignSelf: 'center',
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.xl,
  },
  closeBtnText: {
    color: theme.colors.link,
    fontSize: theme.fontSize.titleSm,
    fontWeight: '600',
  },
}));
