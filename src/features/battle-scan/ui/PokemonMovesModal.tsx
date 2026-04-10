import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PokemonMoveLearnable } from '@src/entities/pokemon-summary';
import { moveDamageClassIconUrl } from '@src/shared/lib/move-damage-class-icons';
import { modalCardSizingStyle } from '@src/shared/lib/modal-layout';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import { formatPokemonSlugAsTitle } from '@src/shared/lib/pokemon-name';

type DamageFilterKey = 'all' | PokemonMoveLearnable['damageClass'];

type DamageClassKey = PokemonMoveLearnable['damageClass'];

const FILTER_COLLAPSE_SCROLL_Y = 56;
/** Altura fija de la franja colapsada (una línea + aire). */
const COLLAPSED_STRIP_HEIGHT = 52;
type Props = {
  visible: boolean;
  onClose: () => void;
  pokemonTitle: string;
  moveNames: string[];
  variant: 'ours' | 'rival';
  loadMoves: (
    moveSlugs: string[],
    onProgress?: (loaded: number, total: number) => void,
  ) => Promise<PokemonMoveLearnable[]>;
};

export function PokemonMovesModal({
  visible,
  onClose,
  pokemonTitle,
  moveNames,
  variant,
  loadMoves,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const wideCardSizing = useMemo(() => modalCardSizingStyle(windowWidth), [windowWidth]);

  const [search, setSearch] = useState('');
  /** Vacío = todos los tipos. Varios = OR (movimientos de cualquiera de esos tipos). */
  const [selectedTypeSlugs, setSelectedTypeSlugs] = useState<string[]>([]);
  /** Vacío = todas las categorías. Varias = OR (físico, especial, etc.). */
  const [selectedDamageClasses, setSelectedDamageClasses] = useState<DamageClassKey[]>([]);
  const [moves, setMoves] = useState<PokemonMoveLearnable[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const skipFilterCollapseUntil = useRef(0);

  const moveNamesKey = moveNames.join('\0');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSearch('');
    setSelectedTypeSlugs([]);
    setSelectedDamageClasses([]);
    setMoves(null);
    setLoadError(null);
    setLoadingMoves(true);
    setLoadProgress(null);
    setFiltersCollapsed(false);

    let cancelled = false;
    const onProgress = (loaded: number, total: number) => {
      if (!cancelled) {
        setLoadProgress({ loaded, total });
      }
    };
    void loadMoves(moveNames, onProgress).then(
      (rows) => {
        if (!cancelled) {
          setMoves(rows);
          setLoadingMoves(false);
        }
      },
      () => {
        if (!cancelled) {
          setLoadError(t('movesModal.errorLoad'));
          setLoadingMoves(false);
          setLoadProgress(null);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [visible, moveNamesKey, loadMoves, moveNames, t]);

  const movesMatchingCategory = useMemo(() => {
    const list = moves ?? [];
    if (selectedDamageClasses.length === 0) {
      return list;
    }
    return list.filter((m) => selectedDamageClasses.includes(m.damageClass));
  }, [moves, selectedDamageClasses]);

  const typeDisplayBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const mv of movesMatchingCategory) {
      if (!m.has(mv.typeName)) {
        m.set(mv.typeName, mv.typeDisplayName);
      }
    }
    return m;
  }, [movesMatchingCategory]);

  const typeIconBySlug = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const mv of movesMatchingCategory) {
      if (!map.has(mv.typeName)) {
        map.set(mv.typeName, mv.typeIconUrl ?? null);
      } else if (map.get(mv.typeName) == null && mv.typeIconUrl) {
        map.set(mv.typeName, mv.typeIconUrl);
      }
    }
    return map;
  }, [movesMatchingCategory]);

  const damageFilterOptions = useMemo(() => {
    const keys: DamageFilterKey[] = ['all', 'physical', 'special', 'status', 'unknown'];
    return keys.map((key) => ({
      key,
      label:
        key === 'all'
          ? t('damageClass.all')
          : key === 'unknown'
            ? t('damageClass.unknown')
            : t(`damageClass.${key}`),
    }));
  }, [t]);

  const typeSlugsSorted = useMemo(() => {
    const set = new Set(movesMatchingCategory.map((m) => m.typeName));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [movesMatchingCategory]);

  useEffect(() => {
    setSelectedTypeSlugs((prev) => {
      const next = prev.filter((slug) => typeSlugsSorted.includes(slug));
      return next.length === prev.length && next.every((s, i) => s === prev[i]) ? prev : next;
    });
  }, [typeSlugsSorted]);

  const searchFilteredMoves = useMemo(() => {
    const list = moves ?? [];
    const q = search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((m) => {
      const hay = [
        m.name.toLowerCase(),
        m.displayName.toLowerCase(),
        m.typeDisplayName.toLowerCase(),
        m.shortEffect?.toLowerCase() ?? '',
        m.flavorText?.toLowerCase() ?? '',
      ].join('\n');
      return hay.includes(q);
    });
  }, [moves, search]);

  const filteredMoves = useMemo(() => {
    return searchFilteredMoves.filter((m) => {
      if (selectedTypeSlugs.length > 0 && !selectedTypeSlugs.includes(m.typeName)) {
        return false;
      }
      if (selectedDamageClasses.length > 0 && !selectedDamageClasses.includes(m.damageClass)) {
        return false;
      }
      return true;
    });
  }, [searchFilteredMoves, selectedTypeSlugs, selectedDamageClasses]);

  const accentChip = variant === 'ours' ? styles.chipSelectedOurs : styles.chipSelectedRival;
  const accentText =
    variant === 'ours' ? styles.chipLabelSelectedOurs : styles.chipLabelSelectedRival;

  const showUnknownChip = (moves ?? []).some((m) => m.damageClass === 'unknown');

  const collapsedFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedTypeSlugs.length > 0) {
      parts.push(
        selectedTypeSlugs
          .map((slug) => typeDisplayBySlug.get(slug) ?? slug)
          .sort((a, b) => a.localeCompare(b))
          .join(', '),
      );
    }
    if (selectedDamageClasses.length > 0) {
      const labels = selectedDamageClasses
        .map((dc) => damageFilterOptions.find((o) => o.key === dc)?.label ?? dc)
        .sort((a, b) => a.localeCompare(b));
      parts.push(labels.join(', '));
    }
    const q = search.trim();
    if (q) {
      parts.push(q.length > 28 ? `${q.slice(0, 26)}…` : q);
    }
    if (parts.length === 0) {
      return t('movesModal.filtersCollapsedSummaryDefault');
    }
    return parts.join(' · ');
  }, [selectedTypeSlugs, typeDisplayBySlug, selectedDamageClasses, damageFilterOptions, search, t]);

  const handleScrollCollapse = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (moves == null) {
        return;
      }
      if (Date.now() < skipFilterCollapseUntil.current) {
        return;
      }
      const y = e.nativeEvent.contentOffset.y;
      if (y > FILTER_COLLAPSE_SCROLL_Y && !filtersCollapsed) {
        setFiltersCollapsed(true);
      }
    },
    [moves, filtersCollapsed],
  );

  function damageClassLabel(dc: PokemonMoveLearnable['damageClass']): string {
    switch (dc) {
      case 'physical':
        return t('damageClass.physical');
      case 'special':
        return t('damageClass.special');
      case 'status':
        return t('damageClass.status');
      default:
        return t('damageClass.dash');
    }
  }

  const totalForCount = moves?.length ?? moveNames.length;

  const expandedFilterSection = (
    <View style={styles.filtersSectionWrap}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('movesModal.searchPlaceholder')}
        placeholderTextColor={theme.colors.textDisabled}
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <Text style={styles.filterHeading}>{t('movesModal.filterType')}</Text>
      <View style={styles.chipWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedTypeSlugs.length === 0 }}
          onPress={() => setSelectedTypeSlugs([])}
          style={[styles.chip, selectedTypeSlugs.length === 0 && accentChip]}
        >
          <Text style={[styles.chipLabel, selectedTypeSlugs.length === 0 && accentText]}>
            {t('movesModal.allTypes')}
          </Text>
        </Pressable>
        {typeSlugsSorted.map((slug) => {
          const selected = selectedTypeSlugs.includes(slug);
          const iconUri = typeIconBySlug.get(slug);
          const label = typeDisplayBySlug.get(slug) ?? slug;
          return (
            <Pressable
              key={slug}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onPress={() =>
                setSelectedTypeSlugs((prev) =>
                  selected ? prev.filter((s) => s !== slug) : [...prev, slug],
                )
              }
              style={[
                styles.chip,
                styles.chipWithIcon,
                selected && accentChip,
                !selected && styles.chipTypeIconCompact,
              ]}
            >
              {iconUri ? (
                <Image
                  source={{ uri: iconUri }}
                  style={styles.chipTypeIcon}
                  importantForAccessibility="no"
                />
              ) : (
                <View style={styles.chipTypeIconPlaceholder} />
              )}
              {selected ? (
                <Animated.Text
                  entering={FadeIn.duration(200).springify().damping(20).stiffness(280)}
                  exiting={FadeOut.duration(140)}
                  style={[styles.chipLabel, accentText]}
                  numberOfLines={1}
                >
                  {label}
                </Animated.Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.filterHeading}>{t('movesModal.filterCategory')}</Text>
      <View style={styles.chipWrap}>
        {damageFilterOptions
          .filter((opt) => opt.key !== 'unknown' || showUnknownChip)
          .map((opt) => {
            const selected =
              opt.key === 'all'
                ? selectedDamageClasses.length === 0
                : selectedDamageClasses.includes(opt.key);
            const damageIconUri =
              opt.key === 'physical' || opt.key === 'special' || opt.key === 'status'
                ? moveDamageClassIconUrl(opt.key)
                : null;
            return (
              <Pressable
                key={opt.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                onPress={() => {
                  if (opt.key === 'all') {
                    setSelectedDamageClasses([]);
                    return;
                  }
                  const dc = opt.key as DamageClassKey;
                  setSelectedDamageClasses((prev) =>
                    prev.includes(dc) ? prev.filter((k) => k !== dc) : [...prev, dc],
                  );
                }}
                style={[
                  styles.chip,
                  damageIconUri ? styles.chipWithIcon : null,
                  selected && accentChip,
                ]}
              >
                {damageIconUri ? (
                  <Image
                    source={{ uri: damageIconUri }}
                    style={styles.chipDamageIcon}
                    importantForAccessibility="no"
                  />
                ) : null}
                <Text style={[styles.chipLabel, selected && accentText]}>{opt.label}</Text>
              </Pressable>
            );
          })}
      </View>
    </View>
  );

  const collapsedFilterStrip = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('movesModal.expandFiltersA11y', { summary: collapsedFiltersSummary })}
      onPress={() => {
        skipFilterCollapseUntil.current = Date.now() + 500;
        setFiltersCollapsed(false);
      }}
      style={styles.collapsedFilterStripInner}
    >
      <Ionicons
        name="options-outline"
        size={17}
        color={theme.colors.ionIconMuted}
        style={styles.collapsedFilterIcon}
      />
      <View style={styles.collapsedFilterTextWrap}>
        <Text style={styles.collapsedFilterSummary} numberOfLines={1}>
          {collapsedFiltersSummary}
        </Text>
        <Text style={styles.collapsedFilterHint} numberOfLines={1}>
          {t('movesModal.filtersCollapsedHint')}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={18} color={theme.colors.textDisabled} />
    </Pressable>
  );

  const countLine = (
    <Text style={styles.countLine}>
      {t('movesModal.count', { filtered: filteredMoves.length, total: totalForCount })}
    </Text>
  );

  const moveRow = (item: PokemonMoveLearnable) => {
    const statBits: string[] = [];
    if (item.pp != null) {
      statBits.push(t('movesModal.pp', { value: item.pp }));
    }
    if (item.priority !== 0) {
      statBits.push(t('movesModal.priority', { value: item.priority }));
    }
    if (item.effectChance != null) {
      statBits.push(t('movesModal.effectChanceShort', { value: item.effectChance }));
    }
    const metaBits: string[] = [];
    if (item.meta) {
      const { ailmentSlug, ailmentChance, flinchChance, statChance } = item.meta;
      if (ailmentChance > 0) {
        metaBits.push(
          t('movesModal.chanceAilment', {
            value: ailmentChance,
            ailment: ailmentSlug ? formatPokemonSlugAsTitle(ailmentSlug) : '—',
          }),
        );
      }
      if (flinchChance > 0) {
        metaBits.push(t('movesModal.chanceFlinch', { value: flinchChance }));
      }
      if (statChance > 0) {
        metaBits.push(t('movesModal.chanceStat', { value: statChance }));
      }
    }

    return (
      <View key={item.name} style={styles.moveRow}>
        {item.typeIconUrl ? (
          <Image
            source={{ uri: item.typeIconUrl }}
            style={styles.typeIcon}
            accessibilityLabel={item.typeDisplayName}
          />
        ) : (
          <View style={styles.typeIconPlaceholder} />
        )}
        <View style={styles.moveMain}>
          <Text style={styles.moveName} numberOfLines={2}>
            {item.displayName}
          </Text>
          <Text style={styles.moveMeta}>
            {item.typeDisplayName} · {damageClassLabel(item.damageClass)}
            {item.power != null && item.power > 0
              ? ` · ${t('movesModal.power', { value: item.power })}`
              : ''}
            {item.accuracy != null ? ` · ${t('movesModal.accuracy', { value: item.accuracy })}` : ''}
          </Text>
          {statBits.length > 0 ? (
            <Text style={styles.moveStatsExtra}>{statBits.join(' · ')}</Text>
          ) : null}
          {item.shortEffect ? (
            <Text
              style={[
                styles.moveShortEffect,
                statBits.length === 0 ? styles.moveShortEffectTightTop : null,
              ]}
            >
              {item.shortEffect}
            </Text>
          ) : null}
          {item.flavorText ? (
            <Text style={styles.moveBlockLabel}>{t('movesModal.flavorLabel')}</Text>
          ) : null}
          {item.flavorText ? <Text style={styles.moveFlavor}>{item.flavorText}</Text> : null}
          {metaBits.length > 0 ? (
            <Text style={styles.moveProbLine}>{metaBits.join(' · ')}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const listEmpty = (
    <Text style={styles.empty}>
      {moves != null && moves.length === 0 ? t('movesModal.emptyNoMoves') : t('movesModal.empty')}
    </Text>
  );

  const hintBlock = <Text style={styles.hint}>{t('movesModal.hint')}</Text>;

  const showLoadedBody = !loadingMoves && moves != null;

  /**
   * Filtros expandidos van en el scroll (gesto vertical los mueve y colapsa).
   * Colapsados: franja fija bajo el título; el scroll solo lleva hint + lista.
   */
  const cardBodyLoaded = showLoadedBody ? (
    <View style={styles.loadedBodyColumn}>
      {filtersCollapsed ? (
        <Animated.View
          entering={FadeIn.duration(240).springify().damping(18).stiffness(220)}
          exiting={FadeOut.duration(160)}
          style={[
            styles.filterCollapsedFixed,
            variant === 'ours' ? styles.filterCollapsedFixedOurs : styles.filterCollapsedFixedRival,
          ]}
        >
          {collapsedFilterStrip}
        </Animated.View>
      ) : null}

      <ScrollView
        style={styles.modalBodyScroll}
        contentContainerStyle={styles.modalBodyScrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onScroll={handleScrollCollapse}
        scrollEventThrottle={16}
      >
        {!filtersCollapsed ? <View style={styles.scrollTopSection}>{hintBlock}</View> : null}
        {!filtersCollapsed ? expandedFilterSection : null}
        <View style={[styles.movesListSection, styles.list]}>
          {countLine}
          {filteredMoves.length === 0 ? listEmpty : filteredMoves.map((item) => moveRow(item))}
        </View>
      </ScrollView>
    </View>
  ) : null;

  return (
    <BackdropModal visible={visible} onClose={onClose}>
      <View
        style={[
          styles.cardOuter,
          {
            justifyContent: showLoadedBody ? 'flex-start' : 'center',
            paddingBottom: Math.max(insets.bottom, 12),
            paddingTop: Math.max(insets.top, 8),
          },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.card,
            showLoadedBody ? styles.cardModalScrollHost : styles.cardModalCompact,
            wideCardSizing,
          ]}
        >
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={2}>
                {t('movesModal.title', { name: pokemonTitle })}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('movesModal.closeA11y')}
                onPress={onClose}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>{t('movesModal.close')}</Text>
              </Pressable>
            </View>

            {loadingMoves ? hintBlock : null}

            {loadingMoves ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <View style={styles.loadingTextCol}>
                  <Text style={styles.loadingText}>{t('movesModal.loadingMoves')}</Text>
                  {loadProgress != null && loadProgress.total > 0 ? (
                    <Text style={styles.loadingProgressText} accessibilityLiveRegion="polite">
                      {t('movesModal.loadingProgress', {
                        loaded: loadProgress.loaded,
                        total: loadProgress.total,
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

            {cardBodyLoaded}
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
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardModalScrollHost: {
    flex: 1,
    alignSelf: 'stretch',
    maxHeight: '100%',
    minHeight: 0,
  },
  /** Carga / error: solo el alto del contenido, sin ocupar toda la pantalla. */
  cardModalCompact: {
    alignSelf: 'stretch',
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  modalBodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  modalBodyScrollContent: {
    paddingBottom: theme.space.xl,
  },
  scrollTopSection: {
    paddingBottom: theme.space.xs,
  },
  filtersSectionWrap: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.space.xs,
    paddingBottom: theme.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderMuted,
  },
  loadedBodyColumn: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  filterCollapsedFixed: {
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  filterCollapsedFixedOurs: {
    borderBottomColor: theme.colors.modalHeaderDividerOurs,
  },
  filterCollapsedFixedRival: {
    borderBottomColor: theme.colors.modalHeaderDividerRival,
  },
  movesListSection: {
    paddingTop: theme.space.md,
  },
  collapsedFilterStripInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.smd,
    paddingHorizontal: theme.space.xl,
    minHeight: COLLAPSED_STRIP_HEIGHT - 2,
  },
  collapsedFilterIcon: {
    flexShrink: 0,
  },
  collapsedFilterTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  collapsedFilterSummary: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 16,
  },
  collapsedFilterHint: {
    fontSize: theme.fontSize.micro,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.mdLg,
    paddingHorizontal: theme.space.xl,
    paddingTop: 14,
    paddingBottom: theme.space.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.modalTitle,
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    paddingVertical: theme.space.smd,
    paddingHorizontal: theme.space.md,
  },
  closeBtnText: {
    fontWeight: '700',
    color: theme.colors.link,
    fontSize: theme.fontSize.titleSm,
  },
  hint: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.space.xl,
    marginBottom: theme.space.md,
    marginTop: theme.space.md,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.mdLg,
  },
  loadingTextCol: {
    flex: 1,
    minWidth: 0,
    gap: theme.space.xxs,
  },
  loadingText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
  },
  loadingProgressText: {
    fontSize: theme.fontSize.body,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.body,
    paddingHorizontal: theme.space.xl,
    marginBottom: theme.space.md,
  },
  searchInput: {
    marginHorizontal: theme.space.xl,
    marginBottom: theme.space.md,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.mdLg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.fontSize.titleSm,
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  filterHeading: {
    fontSize: theme.fontSize.bodySm,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: theme.space.xl,
    marginBottom: theme.space.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.xl,
    marginBottom: theme.space.mdLg,
  },
  chip: {
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.mdLg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neutralSurface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.smd,
    flexShrink: 1,
    maxWidth: '100%',
  },
  /** Solo icono hasta que el usuario selecciona el tipo (ahorra espacio en la rejilla). */
  chipTypeIconCompact: {
    paddingHorizontal: theme.space.sm,
  },
  chipTypeIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  chipTypeIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.statTrack,
  },
  chipSelectedOurs: {
    backgroundColor: theme.colors.oursBgTint,
    borderColor: theme.colors.primary,
  },
  chipSelectedRival: {
    backgroundColor: theme.colors.rivalBgTint,
    borderColor: theme.colors.rivalAccentStrong,
  },
  chipLabel: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.body,
  },
  chipLabelSelectedOurs: {
    color: theme.colors.oursAccent,
  },
  chipLabelSelectedRival: {
    color: theme.colors.rivalAccent,
  },
  countLine: {
    fontSize: theme.fontSize.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.space.smd,
    marginBottom: theme.space.sm,
  },
  list: {
    paddingHorizontal: theme.space.sm,
    paddingBottom: theme.space.mdLg,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  chipDamageIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  typeIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginTop: theme.space.xxs,
  },
  typeIconPlaceholder: {
    width: 28,
    height: 28,
    marginTop: theme.space.xxs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.neutralSurface,
  },
  moveMain: {
    flex: 1,
    minWidth: 0,
  },
  moveName: {
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
    fontSize: theme.fontSize.titleSm,
  },
  moveMeta: {
    marginTop: theme.space.xxs,
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.textMuted,
  },
  moveStatsExtra: {
    marginTop: theme.space.xs,
    fontSize: theme.fontSize.caption,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  moveBlockLabel: {
    marginTop: theme.space.sm,
    fontSize: theme.fontSize.micro,
    fontWeight: '800',
    color: theme.colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  moveShortEffect: {
    marginTop: theme.space.smd,
    fontSize: theme.fontSize.bodySm,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  moveShortEffectTightTop: {
    marginTop: theme.space.xs,
  },
  moveFlavor: {
    marginTop: theme.space.xxs,
    fontSize: theme.fontSize.caption,
    lineHeight: 16,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  moveProbLine: {
    marginTop: theme.space.smd,
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    padding: theme.space.xxxl,
  },
}));
