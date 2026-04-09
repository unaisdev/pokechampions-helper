import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import {
  POKEMON_BASE_STAT_BAR_MAX,
  POKEMON_STAT_RANGE_DISPLAY_LEVEL,
  isHpStatName,
  pokemonStatMinMaxIvEvNatureSpread,
  sortStatsForBattleDisplay,
  statLabelEs,
} from '@src/shared/lib/pokemon-stats-display';
import { formatPokemonSlugAsTitle } from '@src/shared/lib/pokemon-name';

/** Viewport más estrecho que esto: botón de cambio como icono (móvil / columna estrecha). */
const CHANGE_ACTION_ICON_BREAKPOINT = 640;

function formatAbilityLabel(slug: string): string {
  return slug.split('-').join(' ');
}

function statsSectionInfoCopy(level: number): string {
  return `Arriba: stat base en la escala. Abajo: rango calculado a niv. ${level} — relleno tenue hasta el máximo posible y tramo más marcado entre min y max IV/EV. PS sin naturaleza; resto con ×0,9 / ×1,1.`;
}

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
}: TeamPokemonSlotProps) {
  const [statsInfoOpen, setStatsInfoOpen] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const changeActionAsIcon = windowWidth < CHANGE_ACTION_ICON_BREAKPOINT;
  const accent = variant === 'ours' ? styles.accentOurs : styles.accentRival;
  const chipAccent =
    variant === 'ours' ? styles.formChipAccentOurs : styles.formChipAccentRival;
  const titleSlug = summary?.name ?? slug;
  const formOptions =
    summary && summary.megaForms.length > 0
      ? [{ slug: summary.speciesDefaultFormSlug, label: 'Forma base' }, ...summary.megaForms]
      : [];

  const changeActionLabel = summary ? 'Cambiar Pokémon' : 'Cambiar forma';
  const changeIconColor = variant === 'ours' ? '#1d4ed8' : '#b91c1c';

  const battleStatsForRange = summary
    ? sortStatsForBattleDisplay(summary.stats)
    : [];
  const statVisualScaleMax =
    battleStatsForRange.length > 0
      ? Math.max(
          POKEMON_BASE_STAT_BAR_MAX,
          ...battleStatsForRange.map((s) =>
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
            {formatPokemonSlugAsTitle(titleSlug)}
          </Text>
        </View>
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
              <Text
                style={[
                  styles.changePokemonBtnText,
                  variant === 'ours' ? styles.changePokemonBtnTextOurs : styles.changePokemonBtnTextRival,
                ]}
                numberOfLines={2}
              >
                {changeActionLabel}
              </Text>
            )}
          </Pressable>
        ) : null}
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
              accessibilityLabel={summary.name}
            />
          ) : null}

          <View style={styles.typesRow}>
            {summary.types.map((t) => (
              <View key={t.name} style={styles.typeWrap}>
                {t.iconUrl ? (
                  <Image source={{ uri: t.iconUrl }} style={styles.typeIcon} accessibilityLabel={t.name} />
                ) : (
                  <Text style={styles.typeFallback}>{t.name}</Text>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.meta}>
            {summary.heightDm / 10} m · {summary.weightHg / 10} kg · Exp. base {summary.baseExperience}
          </Text>

          {summary.megaForms.length > 0 ? (
            <View style={styles.megaRow}>
              <Text style={styles.megaBadgeText}>Mega evolución (PokéAPI)</Text>
            </View>
          ) : null}

          {formOptions.length > 0 && onSelectFormSlug ? (
            <>
              <Text style={styles.sectionTitle}>Forma en combate</Text>
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
                        style={[
                          styles.formChipLabel,
                          selected && styles.formChipLabelSelected,
                        ]}
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

          <Text style={styles.sectionTitle}>Habilidades posibles</Text>
          {summary.abilities.length === 0 ? (
            <Text style={styles.muted}>—</Text>
          ) : (
            summary.abilities.map((a) => (
              <View key={`${a.slot}-${a.name}`} style={styles.abilityBlock}>
                <Text style={styles.abilityLine}>
                  {formatAbilityLabel(a.name)}
                  {a.isHidden ? ' · oculta' : ''}
                </Text>
                {a.shortEffect ? (
                  <Text style={styles.abilitySubtitle}>{a.shortEffect}</Text>
                ) : null}
              </View>
            ))
          )}

          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, styles.sectionTitleInline]} numberOfLines={2}>
              Stats base y rango (niv. {POKEMON_STAT_RANGE_DISPLAY_LEVEL})
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Información sobre stats base y rango"
              hitSlop={10}
              onPress={() => setStatsInfoOpen(true)}
              style={styles.statsInfoBtn}
            >
              <Ionicons name="information-circle-outline" size={20} color="#71717a" />
            </Pressable>
          </View>
          <Modal
            visible={statsInfoOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setStatsInfoOpen(false)}
          >
            <View style={styles.statsInfoModalWrap}>
              <TouchableWithoutFeedback onPress={() => setStatsInfoOpen(false)}>
                <View style={styles.statsInfoBackdrop} />
              </TouchableWithoutFeedback>
              <View style={styles.statsInfoCardWrap} pointerEvents="box-none">
                <View style={styles.statsInfoCard}>
                  <Text style={styles.statsInfoTitle}>
                    Stats base y rango (niv. {POKEMON_STAT_RANGE_DISPLAY_LEVEL})
                  </Text>
                  <Text style={styles.statsInfoBody}>
                    {statsSectionInfoCopy(POKEMON_STAT_RANGE_DISPLAY_LEVEL)}
                  </Text>
                </View>
              </View>
            </View>
          </Modal>
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
            const rangeBandTint = variant === 'ours' ? styles.statRangeBandOurs : styles.statRangeBandRival;
            return (
              <View key={s.name} style={styles.statRow}>
                <Text style={styles.statLabel}>{statLabelEs(s.name)}</Text>
                <View style={styles.statBarStack}>
                  <View style={styles.statTrack}>
                    <View
                      style={[
                        styles.statBaseFill,
                        rangeBandTint,
                        { width: `${baseFillPct}%` },
                      ]}
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
                  <Text style={styles.statRangeValues} accessibilityLabel={`Rango ${statMin} a ${statMax}`}>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  accentOurs: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  accentRival: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  slotBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOurs: {
    backgroundColor: '#2563eb',
  },
  slotRival: {
    backgroundColor: '#dc2626',
  },
  slotBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
  },
  changePokemonBtn: {
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePokemonBtnWithLabel: {
    maxWidth: '42%',
  },
  changePokemonBtnIconOnly: {
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  changePokemonBtnOurs: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  changePokemonBtnRival: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  changePokemonBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  changePokemonBtnTextOurs: {
    color: '#1d4ed8',
  },
  changePokemonBtnTextRival: {
    color: '#b91c1c',
  },
  centerPad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorInline: {
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 6,
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
    fontSize: 12,
    color: '#52525b',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3f3f46',
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  sectionTitleInline: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
    minWidth: 0,
  },
  statsInfoBtn: {
    padding: 2,
  },
  statsInfoModalWrap: {
    flex: 1,
  },
  statsInfoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  statsInfoCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  statsInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxWidth: 340,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  statsInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 10,
  },
  statsInfoBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3f3f46',
  },
  muted: {
    fontSize: 13,
    color: '#71717a',
  },
  abilityBlock: {
    marginBottom: 8,
  },
  abilityLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27272a',
    textTransform: 'capitalize',
  },
  abilitySubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: '#71717a',
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    width: 56,
    fontSize: 11,
    color: '#52525b',
    alignSelf: 'center',
  },
  statBarStack: {
    flex: 1,
    gap: 4,
  },
  statTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e4e4e7',
    overflow: 'hidden',
    position: 'relative',
  },
  statRangeFillFromStart: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  statRangeToMaxDimmed: {
    opacity: 0.24,
  },
  statRangeBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  statRangeSpreadOpaque: {
    opacity: 0.58,
  },
  statBaseFill: {
    height: '100%',
    borderRadius: 3,
  },
  statRangeBandOurs: {
    backgroundColor: '#6366f1',
  },
  statRangeBandRival: {
    backgroundColor: '#dc2626',
  },
  statValuesCol: {
    minWidth: 52,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
    textAlign: 'right',
  },
  statRangeValues: {
    fontSize: 10,
    fontWeight: '500',
    color: '#52525b',
    textAlign: 'right',
    marginTop: 1,
  },
  megaRow: {
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  megaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  formChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  formChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    maxWidth: '100%',
  },
  formChipSelected: {
    backgroundColor: '#fff',
  },
  formChipAccentOurs: {
    borderColor: '#2563eb',
  },
  formChipAccentRival: {
    borderColor: '#dc2626',
  },
  formChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3f3f46',
  },
  formChipLabelSelected: {
    color: '#18181b',
  },
});
