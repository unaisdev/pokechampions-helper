import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PokemonStatRow } from '@src/entities/pokemon-summary';
import { modalCardSizingStyle } from '@src/shared/lib/modal-layout';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import {
  POKEMON_BASE_STAT_BAR_MAX,
  POKEMON_STAT_RANGE_DISPLAY_LEVEL,
  isHpStatName,
  pokemonStatMinMaxIvEvNatureSpread,
  sortStatsForBattleDisplay,
} from '@src/shared/lib/pokemon-stats-display';

export type CompareOpponentOption = {
  slot: number;
  displayName: string;
  spriteUrl: string | null;
  stats: PokemonStatRow[] | null;
  loading: boolean;
  error: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Variante del Pokémon que abre el modal (colores «yo»). */
  selfVariant: 'ours' | 'rival';
  selfDisplayName: string;
  selfSpriteUrl: string | null;
  selfStats: PokemonStatRow[];
  /** Etiqueta de la columna contraria (p. ej. «Rival»). */
  otherColumnLabel: string;
  opponents: CompareOpponentOption[];
};

function sumBaseStats(stats: PokemonStatRow[]): number {
  return stats.reduce((acc, s) => acc + s.baseStat, 0);
}

function statVisualScaleMaxForPair(
  a: PokemonStatRow[] | null,
  b: PokemonStatRow[] | null,
  level: number,
): number {
  const candidates: number[] = [POKEMON_BASE_STAT_BAR_MAX, 1];
  const collect = (rows: PokemonStatRow[] | null) => {
    if (!rows) {
      return;
    }
    for (const s of rows) {
      candidates.push(s.baseStat);
      const { max } = pokemonStatMinMaxIvEvNatureSpread({
        base: s.baseStat,
        level,
        isHp: isHpStatName(s.name),
      });
      candidates.push(max);
    }
  };
  collect(a);
  collect(b);
  return Math.max(...candidates);
}

type BattleTint = 'ours' | 'rival';

function CompareStatColumn({
  base,
  statName,
  scaleMax,
  level,
  tint,
  dimmed,
}: {
  base: number;
  statName: string;
  scaleMax: number;
  level: number;
  tint: BattleTint;
  dimmed: boolean;
}) {
  const { t } = useTranslation();
  const { min: statMin, max: statMax } = pokemonStatMinMaxIvEvNatureSpread({
    base,
    level,
    isHp: isHpStatName(statName),
  });
  const rangeA11y = t('card.rangeA11y', { min: statMin, max: statMax });
  const span = statMax - statMin;
  const leftPct = (statMin / scaleMax) * 100;
  const widthPctRaw = (span / scaleMax) * 100;
  const widthPct = span === 0 ? 1.25 : Math.max(widthPctRaw, 0.5);
  const maxFillPct = Math.min(100, (statMax / scaleMax) * 100);
  const baseFillPct = Math.min(100, (base / scaleMax) * 100);
  const rangeBandTint = tint === 'ours' ? styles.statRangeBandOurs : styles.statRangeBandRival;
  const labelTint = tint === 'ours' ? styles.colHeadOurs : styles.colHeadRival;

  return (
    <View style={[styles.statColWrap, dimmed ? styles.statColDimmed : null]}>
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
      <View style={styles.statValuesColCompare}>
        <Text style={[styles.statValueMain, labelTint]}>{base}</Text>
        <Text style={styles.statValueRange} accessibilityLabel={rangeA11y}>
          {statMin}–{statMax}
        </Text>
      </View>
    </View>
  );
}

export function PokemonCompareModal({
  visible,
  onClose,
  selfVariant,
  selfDisplayName,
  selfSpriteUrl,
  selfStats,
  otherColumnLabel,
  opponents,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const wideCardSizing = useMemo(() => modalCardSizingStyle(windowWidth), [windowWidth]);

  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectableIndices = useMemo(
    () =>
      opponents
        .map((o, i) => (o.stats != null && !o.loading ? i : -1))
        .filter((i) => i >= 0),
    [opponents],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (selectableIndices.length === 0) {
      return;
    }
    setSelectedIdx((prev) => (selectableIndices.includes(prev) ? prev : selectableIndices[0]!));
  }, [visible, selectableIndices]);

  const opponent = opponents[selectedIdx];
  const opponentStats = opponent?.stats ?? null;

  const orderedRows = useMemo(() => sortStatsForBattleDisplay(selfStats), [selfStats]);
  const oppRowByName = useMemo(() => {
    if (!opponentStats) {
      return new Map<string, PokemonStatRow>();
    }
    return new Map(opponentStats.map((s) => [s.name, s]));
  }, [opponentStats]);

  const level = POKEMON_STAT_RANGE_DISPLAY_LEVEL;
  const statScaleMax = useMemo(
    () => statVisualScaleMaxForPair(selfStats, opponentStats, level),
    [selfStats, opponentStats, level],
  );

  const selfBst = useMemo(() => sumBaseStats(selfStats), [selfStats]);
  const oppBst = opponentStats ? sumBaseStats(opponentStats) : null;

  const selfLabelStyle = selfVariant === 'ours' ? styles.colHeadOurs : styles.colHeadRival;
  const otherLabelStyle = selfVariant === 'ours' ? styles.colHeadRival : styles.colHeadOurs;
  const leftTint: BattleTint = selfVariant === 'ours' ? 'ours' : 'rival';
  const rightTint: BattleTint = selfVariant === 'ours' ? 'rival' : 'ours';

  const body =
    selectableIndices.length === 0 ? (
      <Text style={styles.muted}>{t('compareModal.noSelectableOpponent')}</Text>
    ) : (
      <>
        <Text style={styles.pickHint}>
          {t('compareModal.pickHint', { side: otherColumnLabel })}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipScrollContent}
        >
          {opponents.map((o, i) => {
            const selectable = o.stats != null && !o.loading;
            const selected = i === selectedIdx;
            return (
              <Pressable
                key={`opp-${o.slot}-${i}`}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !selectable }}
                disabled={!selectable}
                onPress={() => setSelectedIdx(i)}
                style={[
                  styles.chip,
                  selectable
                    ? selfVariant === 'ours'
                      ? styles.accentOurs
                      : styles.accentRival
                    : styles.chipDisabled,
                  selected && selectable && styles.chipSelected,
                ]}
              >
                {o.loading ? (
                  <ActivityIndicator size="small" color={theme.colors.ionIconMuted} />
                ) : o.spriteUrl ? (
                  <Image source={{ uri: o.spriteUrl }} style={styles.chipSprite} />
                ) : (
                  <View style={styles.chipSpritePlaceholder} />
                )}
                <Text style={styles.chipSlot}>#{o.slot}</Text>
                <Text numberOfLines={2} style={styles.chipName}>
                  {o.displayName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {opponent?.error ? <Text style={styles.errorInline}>{opponent.error}</Text> : null}

        {opponentStats ? (
          <>
            <View style={styles.vsHeader}>
              <View style={styles.vsCol}>
                {selfSpriteUrl ? (
                  <Image source={{ uri: selfSpriteUrl }} style={styles.vsSprite} />
                ) : (
                  <View style={styles.vsSpritePlaceholder} />
                )}
                <Text style={[styles.vsName, selfLabelStyle]} numberOfLines={2}>
                  {selfDisplayName}
                </Text>
              </View>
              <Text style={styles.vsMark}>VS</Text>
              <View style={styles.vsCol}>
                {opponent.spriteUrl ? (
                  <Image source={{ uri: opponent.spriteUrl }} style={styles.vsSprite} />
                ) : (
                  <View style={styles.vsSpritePlaceholder} />
                )}
                <Text style={[styles.vsName, otherLabelStyle]} numberOfLines={2}>
                  {opponent.displayName}
                </Text>
              </View>
            </View>

            <View style={styles.bstRow}>
              <Text style={styles.bstLabel}>{t('compareModal.bstTotal')}</Text>
              <View style={styles.bstValues}>
                <Text
                  style={[
                    styles.bstValue,
                    selfLabelStyle,
                    oppBst != null && selfBst > oppBst ? styles.valueWin : null,
                    oppBst != null && selfBst < oppBst ? styles.valueLose : null,
                  ]}
                >
                  {selfBst}
                </Text>
                <Text style={styles.bstSep}>—</Text>
                <Text
                  style={[
                    styles.bstValue,
                    otherLabelStyle,
                    oppBst != null && oppBst > selfBst ? styles.valueWin : null,
                    oppBst != null && oppBst < selfBst ? styles.valueLose : null,
                  ]}
                >
                  {oppBst}
                </Text>
              </View>
              {oppBst != null && selfBst !== oppBst ? (
                <Text style={styles.bstDelta}>
                  {selfBst > oppBst
                    ? t('compareModal.bstAhead', { diff: selfBst - oppBst })
                    : t('compareModal.bstBehind', { diff: oppBst - selfBst })}
                </Text>
              ) : (
                <Text style={styles.bstDeltaMuted}>{t('compareModal.tie')}</Text>
              )}
            </View>

            <Text style={styles.statsCaption}>
              {t('compareModal.statsCaption', { level })}
            </Text>

            {orderedRows.map((row) => {
              const left = row.baseStat;
              const oppRow = oppRowByName.get(row.name);
              const right = oppRow?.baseStat;
              const hasPair = right !== undefined;
              let winner: 'left' | 'right' | 'tie' | 'unknown' = 'unknown';
              if (hasPair) {
                if (left > right!) {
                  winner = 'left';
                } else if (right! > left) {
                  winner = 'right';
                } else {
                  winner = 'tie';
                }
              }

              return (
                <View key={row.name} style={styles.statBlock}>
                  <Text style={styles.statName}>{row.displayName}</Text>
                  <View style={styles.statCompareRow}>
                    <View style={styles.statHalf}>
                      <CompareStatColumn
                        base={left}
                        statName={row.name}
                        scaleMax={statScaleMax}
                        level={level}
                        tint={leftTint}
                        dimmed={hasPair && winner === 'right'}
                      />
                    </View>
                    <View style={styles.statHalf}>
                      {hasPair && oppRow ? (
                        <CompareStatColumn
                          base={right!}
                          statName={row.name}
                          scaleMax={statScaleMax}
                          level={level}
                          tint={rightTint}
                          dimmed={winner === 'left'}
                        />
                      ) : (
                        <Text style={styles.statMissing}>—</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.muted}>{t('compareModal.waitLoad')}</Text>
        )}
      </>
    );

  return (
    <BackdropModal visible={visible} onClose={onClose}>
      <View
        style={[
          styles.cardOuter,
          { paddingBottom: Math.max(insets.bottom, 12), paddingTop: Math.max(insets.top, 8) },
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.card, wideCardSizing]}>
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={2}>
                {t('compareModal.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('compareModal.closeA11y')}
                onPress={onClose}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>{t('compareModal.close')}</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>{t('compareModal.hint')}</Text>
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {body}
            </ScrollView>
          </View>
        </View>
    </BackdropModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardOuter: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.space.xl,
    pointerEvents: 'box-none',
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '88%',
    overflow: 'hidden',
    alignSelf: 'stretch',
    width: '100%',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.mdLg,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.modalTitle,
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.sm,
  },
  closeBtnText: {
    color: theme.colors.link,
    fontWeight: '700',
    fontSize: theme.fontSize.titleSm,
  },
  hint: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.sm,
    lineHeight: 17,
  },
  bodyScroll: {
    maxHeight: '100%',
  },
  bodyScrollContent: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xl,
  },
  pickHint: {
    fontSize: theme.fontSize.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.space.sm,
  },
  chipScroll: {
    marginBottom: theme.space.lg,
    maxHeight: 120,
  },
  chipScrollContent: {
    gap: theme.space.sm,
    paddingBottom: theme.space.xs,
  },
  chip: {
    width: 104,
    padding: theme.space.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  accentOurs: {
    backgroundColor: theme.colors.oursBgSoft,
    borderColor: theme.colors.oursBorderSoft,
  },
  accentRival: {
    backgroundColor: theme.colors.rivalBgSoft,
    borderColor: theme.colors.rivalBorderSoft,
  },
  chipSprite: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  chipSpritePlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.chipSpritePlaceholder,
    borderRadius: theme.radius.md,
  },
  chipSlot: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginTop: theme.space.xs,
  },
  chipName: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.space.xxs,
  },
  errorInline: {
    color: theme.colors.error,
    fontSize: theme.fontSize.bodySm,
    marginBottom: theme.space.sm,
  },
  muted: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  vsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    marginBottom: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  vsCol: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  vsSprite: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  vsSpritePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: theme.colors.chipSpritePlaceholder,
    borderRadius: theme.radius.lg,
  },
  vsName: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: theme.space.smd,
  },
  colHeadOurs: {
    color: theme.colors.oursAccent,
  },
  colHeadRival: {
    color: theme.colors.rivalAccent,
  },
  vsMark: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '900',
    color: theme.colors.compareVsMark,
  },
  bstRow: {
    marginBottom: theme.space.xl,
    padding: theme.space.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bstLabel: {
    fontSize: theme.fontSize.caption,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: theme.space.smd,
  },
  bstValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
  },
  bstValue: {
    fontSize: theme.fontSize.hero,
    fontWeight: '800',
  },
  bstSep: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.compareVsMark,
  },
  bstDelta: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.space.smd,
  },
  bstDeltaMuted: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.compareVsMark,
    textAlign: 'center',
    marginTop: theme.space.smd,
  },
  statsCaption: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textMuted,
    lineHeight: 15,
    marginBottom: theme.space.md,
  },
  statBlock: {
    marginBottom: theme.space.mdLg,
  },
  statName: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.space.smd,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statCompareRow: {
    flexDirection: 'row',
    gap: theme.space.md,
  },
  statHalf: {
    flex: 1,
    minWidth: 0,
  },
  statColWrap: {
    width: '100%',
  },
  statColDimmed: {
    opacity: 0.58,
  },
  statBarStack: {
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
  statValuesColCompare: {
    alignItems: 'center',
    marginTop: theme.space.xs,
    minWidth: 0,
  },
  statValueMain: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValueRange: {
    fontSize: theme.fontSize.micro,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  statMissing: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.compareVsMark,
    textAlign: 'center',
    paddingVertical: theme.space.xxxl,
  },
  valueWin: {
    transform: [{ scale: 1.02 }],
  },
  valueLose: {
    opacity: 0.55,
  },
}));
