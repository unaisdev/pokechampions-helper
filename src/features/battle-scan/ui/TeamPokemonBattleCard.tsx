import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import {
  POKEMON_BASE_STAT_BAR_MAX,
  POKEMON_STAT_RANGE_DISPLAY_LEVEL,
  isHpStatName,
  pokemonStatMinMaxIvEvNatureSpread,
  sortStatsForBattleDisplay,
} from '@src/shared/lib/pokemon-stats-display';
import { defaultPokemonRepository } from '@src/shared/api';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import { appLocaleToPokeApiLanguage } from '@src/shared/lib/app-locale-to-pokeapi-language';
import { formatPokemonSlugAsTitle } from '@src/shared/lib/pokemon-name';

import { PokemonCompareModal, type CompareOpponentOption } from './PokemonCompareModal';
import { PokemonMovesModal } from './PokemonMovesModal';

/** Viewport más estrecho que esto: botón de cambio como icono (móvil / columna estrecha). */
const CHANGE_ACTION_ICON_BREAKPOINT = 640;

export type TeamPokemonSlotProps = {
  slot: number;
  slug: string;
  /** Slug activo en PokéAPI (p. ej. mega); controla stats y sprite. */
  formSlug: string;
  loading: boolean;
  error: string | null;
  summary: PokemonSummary | null;
  variant: 'ours' | 'rival';
  onPressChangePokemon?: () => void;
  onSelectFormSlug?: (slug: string) => void;
  /** Pokémon del otro bando para el modal «comparar stats»; si falta o está vacío, no se muestra el botón. */
  compareOpponents?: CompareOpponentOption[];
  compareOtherColumnLabel?: string;
};

export function TeamPokemonBattleCard({
  slot,
  slug,
  formSlug,
  loading,
  error,
  summary,
  variant,
  onPressChangePokemon,
  onSelectFormSlug,
  compareOpponents,
  compareOtherColumnLabel,
}: TeamPokemonSlotProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const pokeApiLanguage = appLocaleToPokeApiLanguage(i18n.language);
  const [statsInfoOpen, setStatsInfoOpen] = useState(false);
  const [movesModalOpen, setMovesModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [abilityExtras, setAbilityExtras] = useState<
    Record<string, { displayName: string; shortEffect: string | null }>
  >({});

  const loadMoves = useCallback(
    (slugs: string[], onProgress?: (loaded: number, total: number) => void) =>
      defaultPokemonRepository.getMoveLearnablesForSlugs(slugs, {
        pokeApiLanguage,
        onProgress,
      }),
    [pokeApiLanguage],
  );

  const abilityNamesKey =
    summary?.abilities?.map((a) => a.name).join('\0') ?? '';

  useEffect(() => {
    setAbilityExtras({});

    if (!summary?.abilities?.length) {
      return;
    }
    const uniqueNames = [...new Set(summary.abilities.map((a) => a.name))];
    for (const name of uniqueNames) {
      void defaultPokemonRepository
        .getAbilityDetail(name, { pokeApiLanguage })
        .then((detail) => {
          setAbilityExtras((prev) => ({ ...prev, [name]: detail }));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- abilityNamesKey encodes `summary.abilities` slugs
  }, [summary?.name, formSlug, pokeApiLanguage, abilityNamesKey]);
  const { width: windowWidth } = useWindowDimensions();
  const changeActionAsIcon = windowWidth < CHANGE_ACTION_ICON_BREAKPOINT;
  const accent = variant === 'ours' ? styles.accentOurs : styles.accentRival;
  const chipAccent =
    variant === 'ours' ? styles.formChipAccentOurs : styles.formChipAccentRival;
  const titleDisplay = summary?.displayName ?? formatPokemonSlugAsTitle(slug);
  const formOptions =
    summary && summary.megaForms.length > 0
      ? [{ slug: summary.speciesDefaultFormSlug, label: t('card.defaultForm') }, ...summary.megaForms]
      : [];

  const changeActionLabel = summary ? t('card.changePokemon') : t('card.changeForm');
  const changeIconColor = variant === 'ours' ? theme.colors.oursAccent : theme.colors.rivalAccent;
  const moveNames = summary?.moveNames ?? [];

  const battleStatsForRange = summary ? sortStatsForBattleDisplay(summary.stats) : [];
  const statVisualScaleMax =
    battleStatsForRange.length > 0
      ? Math.max(
          POKEMON_BASE_STAT_BAR_MAX,
          ...battleStatsForRange.map(
            (s) =>
              pokemonStatMinMaxIvEvNatureSpread({
                base: s.baseStat,
                level: POKEMON_STAT_RANGE_DISPLAY_LEVEL,
                isHp: isHpStatName(s.name),
              }).max,
          ),
          1,
        )
      : POKEMON_BASE_STAT_BAR_MAX;

  return (
    <View style={[styles.card, accent]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.slotBadge, variant === 'ours' ? styles.slotOurs : styles.slotRival]}>
            <Text style={styles.slotBadgeText}>{slot}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {titleDisplay}
          </Text>
        </View>
        <View style={styles.cardHeaderActions}>
          {summary &&
          compareOpponents != null &&
          compareOpponents.length > 0 &&
          compareOtherColumnLabel != null ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('card.compareStatsA11y')}
                onPress={() => setCompareModalOpen(true)}
                style={[
                  styles.changePokemonBtn,
                  !changeActionAsIcon && styles.changePokemonBtnWithLabel,
                  changeActionAsIcon && styles.changePokemonBtnIconOnly,
                  variant === 'ours' ? styles.changePokemonBtnOurs : styles.changePokemonBtnRival,
                ]}
              >
                {changeActionAsIcon ? (
                  <Ionicons name="git-compare-outline" size={22} color={changeIconColor} />
                ) : (
                  <View style={styles.headerActionLabelRow}>
                    <Ionicons name="git-compare-outline" size={18} color={changeIconColor} />
                    <Text
                      style={[
                        styles.changePokemonBtnText,
                        styles.headerActionLabelText,
                        variant === 'ours' ? styles.changePokemonBtnTextOurs : styles.changePokemonBtnTextRival,
                      ]}
                      numberOfLines={1}
                    >
                      {t('card.compareStats')}
                    </Text>
                  </View>
                )}
              </Pressable>
              <PokemonCompareModal
                visible={compareModalOpen}
                onClose={() => setCompareModalOpen(false)}
                selfVariant={variant}
                selfDisplayName={titleDisplay}
                selfSpriteUrl={summary.spriteUrl}
                selfStats={summary.stats}
                otherColumnLabel={compareOtherColumnLabel}
                opponents={compareOpponents}
              />
            </>
          ) : null}
          {onPressChangePokemon && !loading ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={changeActionLabel}
              style={[
                styles.changePokemonBtn,
                !changeActionAsIcon && styles.changePokemonBtnWithLabel,
                changeActionAsIcon && styles.changePokemonBtnIconOnly,
                variant === 'ours' ? styles.changePokemonBtnOurs : styles.changePokemonBtnRival,
              ]}
              onPress={onPressChangePokemon}
            >
              {changeActionAsIcon ? (
                <Ionicons name="swap-horizontal" size={22} color={changeIconColor} />
              ) : (
                <View style={styles.headerActionLabelRow}>
                  <Ionicons name="swap-horizontal" size={18} color={changeIconColor} />
                  <Text
                    style={[
                      styles.changePokemonBtnText,
                      styles.headerActionLabelText,
                      variant === 'ours' ? styles.changePokemonBtnTextOurs : styles.changePokemonBtnTextRival,
                    ]}
                    numberOfLines={2}
                  >
                    {changeActionLabel}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerPad}>
          <ActivityIndicator />
        </View>
      ) : null}

      {error ? <Text style={styles.errorInline}>{error}</Text> : null}

      {!loading && summary ? (
        <>
          {summary.spriteUrl ? (
            <Image
              source={{ uri: summary.spriteUrl }}
              style={styles.sprite}
              accessibilityLabel={summary.displayName}
            />
          ) : null}

          <View style={styles.typesRow}>
            {summary.types.map((slot) => (
              <View key={slot.name} style={styles.typeWrap}>
                {slot.iconUrl ? (
                  <Image
                    source={{ uri: slot.iconUrl }}
                    style={styles.typeIcon}
                    accessibilityLabel={slot.displayName}
                  />
                ) : (
                  <Text style={styles.typeFallback}>{slot.displayName}</Text>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.meta}>
            {t('card.meta', {
              height: summary.heightDm / 10,
              weight: summary.weightHg / 10,
              exp: summary.baseExperience,
            })}
          </Text>

          {summary.megaForms.length > 0 ? (
            <View style={styles.megaRow}>
              <Text style={styles.megaBadgeText}>{t('card.megaBadge')}</Text>
            </View>
          ) : null}

          {formOptions.length > 0 && onSelectFormSlug ? (
            <>
              <Text style={styles.sectionTitle}>{t('card.battleForm')}</Text>
              <View style={styles.formChips}>
                {formOptions.map((opt) => {
                  const selected = formSlug === opt.slug;
                  return (
                    <Pressable
                      key={opt.slug}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: loading }}
                      style={[
                        styles.formChip,
                        selected && styles.formChipSelected,
                        selected && chipAccent,
                      ]}
                      disabled={loading}
                      onPress={() => {
                        if (loading || selected) {
                          return;
                        }
                        onSelectFormSlug(opt.slug);
                      }}
                    >
                      <Text
                        style={[styles.formChipLabel, selected && styles.formChipLabelSelected]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>{t('card.abilitiesSection')}</Text>
          {summary.abilities.length === 0 ? (
            <Text style={styles.muted}>—</Text>
          ) : (
            summary.abilities.map((a) => {
              const extra = abilityExtras[a.name];
              const lineName = extra?.displayName ?? a.displayName;
              const effect = extra?.shortEffect ?? a.shortEffect;
              return (
                <View key={`${a.slot}-${a.name}`} style={styles.abilityBlock}>
                  <Text style={styles.abilityLine}>
                    {lineName}
                    {a.isHidden ? t('card.hiddenAbility') : ''}
                  </Text>
                  {effect ? <Text style={styles.abilitySubtitle}>{effect}</Text> : null}
                </View>
              );
            })
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('card.movesA11y', { count: moveNames.length })}
            onPress={() => setMovesModalOpen(true)}
            style={[
              styles.movesBlock,
              variant === 'ours' ? styles.movesBlockOurs : styles.movesBlockRival,
            ]}
          >
            <View style={styles.movesBlockTextWrap}>
              <Text style={styles.movesBlockTitle}>{t('card.movesTitle')}</Text>
              <Text style={styles.movesBlockSubtitle}>
                {moveNames.length > 0
                  ? t('card.movesSubtitle', { count: moveNames.length })
                  : t('card.movesSubtitleEmpty')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={variant === 'ours' ? theme.colors.oursAccent : theme.colors.rivalAccent}
            />
          </Pressable>
          <PokemonMovesModal
            visible={movesModalOpen}
            onClose={() => setMovesModalOpen(false)}
            pokemonTitle={titleDisplay}
            moveNames={moveNames}
            variant={variant}
            loadMoves={loadMoves}
          />

          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, styles.sectionTitleInline]} numberOfLines={2}>
              {t('card.statsSection', { level: POKEMON_STAT_RANGE_DISPLAY_LEVEL })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('card.statsInfoA11y')}
              hitSlop={10}
              onPress={() => setStatsInfoOpen(true)}
              style={styles.statsInfoBtn}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.ionIconMuted} />
            </Pressable>
          </View>
          <BackdropModal visible={statsInfoOpen} onClose={() => setStatsInfoOpen(false)}>
            <View style={styles.statsInfoCardWrap} pointerEvents="box-none">
              <View style={styles.statsInfoCard}>
                <Text style={styles.statsInfoTitle}>
                  {t('card.statsInfoTitle', { level: POKEMON_STAT_RANGE_DISPLAY_LEVEL })}
                </Text>
                <Text style={styles.statsInfoBody}>
                  {t('card.statsInfoBody', { level: POKEMON_STAT_RANGE_DISPLAY_LEVEL })}
                </Text>
              </View>
            </View>
          </BackdropModal>
          {battleStatsForRange.map((s) => {
            const { min: statMin, max: statMax } = pokemonStatMinMaxIvEvNatureSpread({
              base: s.baseStat,
              level: POKEMON_STAT_RANGE_DISPLAY_LEVEL,
              isHp: isHpStatName(s.name),
            });
            const span = statMax - statMin;
            const leftPct = (statMin / statVisualScaleMax) * 100;
            const widthPctRaw = (span / statVisualScaleMax) * 100;
            const widthPct = span === 0 ? 1.25 : Math.max(widthPctRaw, 0.5);
            const maxFillPct = Math.min(100, (statMax / statVisualScaleMax) * 100);
            const baseFillPct = Math.min(100, (s.baseStat / statVisualScaleMax) * 100);
            const rangeBandTint =
              variant === 'ours' ? styles.statRangeBandOurs : styles.statRangeBandRival;
            return (
              <View key={s.name} style={styles.statRow}>
                <Text style={styles.statLabel}>{s.displayName}</Text>
                <View style={styles.statBarStack}>
                  <View style={styles.statTrack}>
                    <View
                      style={[styles.statBaseFill, rangeBandTint, { width: `${baseFillPct}%` }]}
                    />
                  </View>
                  <View style={styles.statTrack}>
                    <View
                      style={[
                        styles.statRangeFillFromStart,
                        rangeBandTint,
                        styles.statRangeToMaxDimmed,
                        { width: `${maxFillPct}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.statRangeBand,
                        rangeBandTint,
                        styles.statRangeSpreadOpaque,
                        { left: `${leftPct}%`, width: `${widthPct}%` },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statValuesCol}>
                  <Text style={styles.statValue}>{s.baseStat}</Text>
                  <Text
                    style={styles.statRangeValues}
                    accessibilityLabel={t('card.rangeA11y', { min: statMin, max: statMax })}
                  >
                    {statMin}–{statMax}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    marginBottom: theme.space.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  accentOurs: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  accentRival: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.rivalAccentStrong,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    marginBottom: theme.space.smd,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minWidth: 0,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.smd,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  slotBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOurs: {
    backgroundColor: theme.colors.primary,
  },
  slotRival: {
    backgroundColor: theme.colors.rivalAccentStrong,
  },
  slotBadgeText: {
    color: theme.colors.onPrimary,
    fontWeight: '800',
    fontSize: theme.fontSize.body,
  },
  name: {
    flex: 1,
    fontSize: theme.fontSize.screenTitle,
    fontWeight: '700',
    color: theme.colors.text,
  },
  changePokemonBtn: {
    flexShrink: 0,
    paddingVertical: theme.space.smd,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePokemonBtnWithLabel: {
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: theme.space.md,
  },
  headerActionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.smd,
    minWidth: 0,
  },
  headerActionLabelText: {
    flexShrink: 1,
    minWidth: 0,
  },
  changePokemonBtnIconOnly: {
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  changePokemonBtnOurs: {
    backgroundColor: theme.colors.oursBgTint,
    borderColor: theme.colors.oursBorderSoft,
  },
  changePokemonBtnRival: {
    backgroundColor: theme.colors.rivalBgTint,
    borderColor: theme.colors.rivalBorderSoft,
  },
  changePokemonBtnText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  changePokemonBtnTextOurs: {
    color: theme.colors.oursAccent,
  },
  changePokemonBtnTextRival: {
    color: theme.colors.rivalAccent,
  },
  centerPad: {
    paddingVertical: theme.space.xl,
    alignItems: 'center',
  },
  errorInline: {
    color: theme.colors.error,
    fontSize: theme.fontSize.body,
    marginBottom: theme.space.smd,
  },
  sprite: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 4,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 6,
  },
  typeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  typeFallback: {
    fontSize: 12,
    textTransform: 'capitalize',
    opacity: 0.8,
  },
  meta: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.space.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.titleSm,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginTop: theme.space.smd,
    marginBottom: theme.space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.smd,
    marginTop: theme.space.smd,
    marginBottom: theme.space.xs,
    flexWrap: 'wrap',
  },
  sectionTitleInline: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
    minWidth: 0,
  },
  statsInfoBtn: {
    padding: theme.space.xxs,
  },
  statsInfoCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.space.xxxl,
    pointerEvents: 'box-none',
  },
  statsInfoCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: theme.space.xl,
    maxWidth: 340,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  statsInfoTitle: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.space.md,
  },
  statsInfoBody: {
    fontSize: theme.fontSize.body,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  muted: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textMuted,
  },
  abilityBlock: {
    marginBottom: theme.space.sm,
  },
  abilityLine: {
    fontSize: theme.fontSize.body,
    fontWeight: '600',
    color: theme.colors.textInk,
    textTransform: 'capitalize',
  },
  abilitySubtitle: {
    fontSize: theme.fontSize.caption,
    lineHeight: 15,
    color: theme.colors.textMuted,
    marginTop: theme.space.xxs,
  },
  movesBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
    marginTop: theme.space.sm,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.mdLg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  movesBlockOurs: {
    backgroundColor: theme.colors.oursBgSoft,
    borderColor: theme.colors.oursBorderSoft,
  },
  movesBlockRival: {
    backgroundColor: theme.colors.rivalBgSoft,
    borderColor: theme.colors.rivalBorderSoft,
  },
  movesBlockTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  movesBlockTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  movesBlockSubtitle: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xxs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.smd,
    marginBottom: theme.space.smd,
  },
  statLabel: {
    width: 56,
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
    alignSelf: 'center',
  },
  statBarStack: {
    flex: 1,
    gap: theme.space.xs,
  },
  statTrack: {
    height: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.statTrack,
    overflow: 'hidden',
    position: 'relative',
  },
  statRangeFillFromStart: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: theme.radius.xs,
  },
  statRangeToMaxDimmed: {
    opacity: 0.24,
  },
  statRangeBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: theme.radius.xs,
  },
  statRangeSpreadOpaque: {
    opacity: 0.58,
  },
  statBaseFill: {
    height: '100%',
    borderRadius: theme.radius.xs,
  },
  statRangeBandOurs: {
    backgroundColor: theme.colors.oursStatBar,
  },
  statRangeBandRival: {
    backgroundColor: theme.colors.rivalStatBar,
  },
  statValuesCol: {
    minWidth: 52,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'right',
  },
  statRangeValues: {
    fontSize: theme.fontSize.micro,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 1,
  },
  megaRow: {
    alignSelf: 'center',
    backgroundColor: theme.colors.warningBg,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.md,
    marginBottom: theme.space.smd,
  },
  megaBadgeText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.warningText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  formChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.smd,
    marginBottom: theme.space.xs,
  },
  formChip: {
    paddingVertical: theme.space.smd,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.neutralSurface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: '100%',
  },
  formChipSelected: {
    backgroundColor: theme.colors.background,
  },
  formChipAccentOurs: {
    borderColor: theme.colors.primary,
  },
  formChipAccentRival: {
    borderColor: theme.colors.rivalAccentStrong,
  },
  formChipLabel: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  formChipLabelSelected: {
    color: theme.colors.text,
  },
}));
