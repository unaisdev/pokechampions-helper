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
import {
  MODAL_WIDE_LAYOUT_MIN_WIDTH,
  modalCardSizingStyle,
} from '@src/shared/lib/modal-layout';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import {
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

type BattleTint = 'ours' | 'rival';

function CompareStatTableCell({
  base,
  statName,
  level,
  tint,
  dimmed,
}: {
  base: number;
  statName: string;
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
  const labelTint = tint === 'ours' ? styles.colHeadOurs : styles.colHeadRival;

  return (
    <View style={[styles.statTableValueCell, dimmed ? styles.statTableValueDimmed : null]}>
      <Text style={[styles.statTableBase, labelTint]}>{base}</Text>
      <Text style={styles.statTableRange} accessibilityLabel={rangeA11y}>
        {statMin}–{statMax}
      </Text>
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
  const wideCardSizing = useMemo(
    () => modalCardSizingStyle(windowWidth, { widthPercent: 35 }),
    [windowWidth],
  );

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

  const selfLabelStyle = selfVariant === 'ours' ? styles.colHeadOurs : styles.colHeadRival;
  const otherLabelStyle = selfVariant === 'ours' ? styles.colHeadRival : styles.colHeadOurs;
  const leftTint: BattleTint = selfVariant === 'ours' ? 'ours' : 'rival';
  const rightTint: BattleTint = selfVariant === 'ours' ? 'rival' : 'ours';

  const renderCompareOpponentChips = () =>
    opponents.map((o, i) => {
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
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.chipName}>
            {o.displayName}
          </Text>
        </Pressable>
      );
    });

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
          nestedScrollEnabled
          showsHorizontalScrollIndicator={windowWidth >= MODAL_WIDE_LAYOUT_MIN_WIDTH}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipScrollContent}
        >
          {renderCompareOpponentChips()}
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

            <Text style={styles.statsCaption}>
              {t('compareModal.statsCaption', { level })}
            </Text>

            <View style={styles.statTable}>
              <View style={styles.statTableHeaderRow}>
                <Text style={styles.statTableHdrStat}>
                  {t('compareModal.tableHeaderStat', { defaultValue: 'Stat' })}
                </Text>
                <Text
                  style={[styles.statTableHdrName, selfLabelStyle]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {selfDisplayName}
                </Text>
                <Text
                  style={[styles.statTableHdrName, otherLabelStyle]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {opponent.displayName}
                </Text>
              </View>
              {orderedRows.map((row, idx) => {
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
                const isLastRow = idx === orderedRows.length - 1;

                return (
                  <View
                    key={row.name}
                    style={[
                      styles.statTableRow,
                      idx % 2 === 1 ? styles.statTableRowAlt : null,
                      isLastRow ? styles.statTableRowLast : null,
                    ]}
                  >
                    <Text style={styles.statTableCellStat}>{row.displayName}</Text>
                    <CompareStatTableCell
                      base={left}
                      statName={row.name}
                      level={level}
                      tint={leftTint}
                      dimmed={hasPair && winner === 'right'}
                    />
                    {hasPair && oppRow ? (
                      <CompareStatTableCell
                        base={right!}
                        statName={row.name}
                        level={level}
                        tint={rightTint}
                        dimmed={winner === 'left'}
                      />
                    ) : (
                      <View style={styles.statTableValueCell}>
                        <Text style={styles.statTableMissing}>—</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
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
                hitSlop={8}
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
              nestedScrollEnabled
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
    flexDirection: 'column',
    flexShrink: 1,
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.mdLg,
    paddingBottom: theme.space.xxs,
  },
  title: {
    fontSize: theme.fontSize.modalTitle,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    paddingHorizontal: theme.space.bottomXL,
  },
  closeBtn: {
    position: 'absolute',
    right: theme.space.lg,
    top: theme.space.mdLg,
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
    textAlign: 'center',
  },
  bodyScroll: {
    flex: 1,
    minHeight: 0,
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
    textAlign: 'center',
  },
  chipScroll: {
    marginBottom: theme.space.md,
    maxHeight: 94,
  },
  chipScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: theme.space.xs,
    paddingBottom: 2,
    alignItems: 'center',
  },
  chip: {
    width: 80,
    paddingVertical: theme.space.xxs,
    paddingHorizontal: theme.space.xs,
    borderRadius: theme.radius.md,
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
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  chipSpritePlaceholder: {
    width: 42,
    height: 42,
    backgroundColor: theme.colors.chipSpritePlaceholder,
    borderRadius: theme.radius.sm,
  },
  chipName: {
    fontSize: theme.fontSize.micro,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 1,
    maxWidth: 76,
  },
  errorInline: {
    color: theme.colors.error,
    fontSize: theme.fontSize.bodySm,
    marginBottom: theme.space.sm,
    textAlign: 'center',
  },
  muted: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  vsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.xs,
    marginBottom: theme.space.md,
    paddingVertical: theme.space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  vsCol: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  vsSprite: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  vsSpritePlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.chipSpritePlaceholder,
    borderRadius: theme.radius.md,
  },
  vsName: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: theme.space.xs,
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
  statsCaption: {
    fontSize: theme.fontSize.micro,
    color: theme.colors.textMuted,
    lineHeight: 14,
    marginBottom: theme.space.smd,
    textAlign: 'center',
  },
  statTable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  statTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.xs,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  statTableHdrStat: {
    flex: 0.85,
    minWidth: 36,
    fontSize: theme.fontSize.micro,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  statTableHdrName: {
    flex: 1,
    minWidth: 0,
    fontSize: theme.fontSize.micro,
    fontWeight: '800',
    textAlign: 'center',
  },
  statTableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  statTableRowAlt: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  statTableRowLast: {
    borderBottomWidth: 0,
  },
  statTableCellStat: {
    flex: 0.85,
    minWidth: 36,
    alignSelf: 'center',
    fontSize: theme.fontSize.micro,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  statTableValueCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.xxs,
    paddingHorizontal: theme.space.xxs,
  },
  statTableValueDimmed: {
    opacity: 0.52,
  },
  statTableBase: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '800',
    textAlign: 'center',
  },
  statTableRange: {
    fontSize: theme.fontSize.micro,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  statTableMissing: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '700',
    color: theme.colors.compareVsMark,
    textAlign: 'center',
  },
}));
