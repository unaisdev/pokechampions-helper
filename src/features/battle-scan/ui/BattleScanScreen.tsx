import '@src/shared/theme/unistyles';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import {
  GEMINI_TEAM_SCAN_PROMPT,
  parseGeminiTeamScanResponse,
  type GeminiManualTeamScanV1,
} from '@src/features/battle-scan/lib/gemini-manual-team-scan';
import { randomDemoTeamScan } from '@src/features/battle-scan/lib/random-demo-teams';
import { ChangePokemonModal } from '@src/features/battle-scan/ui/ChangePokemonModal';
import { CompactTeamMobileShell } from '@src/features/battle-scan/ui/CompactTeamMobileShell';
import { TeamPokemonBattleCard } from '@src/features/battle-scan/ui/TeamPokemonBattleCard';
import { defaultPokemonRepository } from '@src/shared/api';
import { SettingsModal } from '@src/shared/settings/SettingsModal';
import { appLocaleToPokeApiLanguage } from '@src/shared/lib/app-locale-to-pokeapi-language';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';
import { modalCardSizingStyle } from '@src/shared/lib/modal-layout';
import { BackdropModal } from '@src/shared/ui/BackdropModal';
import {
  TAB_SCREEN_DESKTOP_MAX_WIDTH,
  TAB_SCREEN_DESKTOP_MIN_WIDTH,
  WEB_DESKTOP_SPLIT_MIN_WIDTH,
} from '@src/shared/ui/TabScreenContentFrame';
import { formatPokemonSlugAsTitle, normalizePokemonNameQuery } from '@src/shared/lib/pokemon-name';

/** Ancho por debajo del cual los equipos pasan a pestañas inferiores a pantalla completa (ancho). */
const COMPACT_TEAM_ARENA_BREAKPOINT = 640;

/** Captura de ejemplo: pantalla previa con dos columnas (la misma que debe adjuntarse en Gemini). */
const GEMINI_TEAM_SCAN_EXAMPLE_SOURCE = require('../../../../assets/images/example/example.jpeg');

type TeamSlotFetch = {
  /** Especie / identidad del hueco (import o «Cambiar Pokémon»); no cambia al elegir mega. */
  slug: string;
  /** Slug consultado en PokéAPI (puede ser forma mega). */
  formSlug: string;
  loading: boolean;
  error: string | null;
  data: PokemonSummary | null;
};

type ChangeSlotTarget = {
  side: 'our' | 'rival';
  index: number;
  slug: string;
};

export function BattleScanScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();
  const isWebDesktopSplitLayout =
    Platform.OS === 'web' && windowWidth >= WEB_DESKTOP_SPLIT_MIN_WIDTH;
  /** Ancho útil del tab (columna estrecha 640–899px web; si no, viewport). */
  const tabLayoutWidth =
    Platform.OS === 'web' &&
    windowWidth >= TAB_SCREEN_DESKTOP_MIN_WIDTH &&
    !isWebDesktopSplitLayout
      ? Math.min(windowWidth, TAB_SCREEN_DESKTOP_MAX_WIDTH)
      : windowWidth;
  const insets = useSafeAreaInsets();
  const pokeApiLanguage = appLocaleToPokeApiLanguage(i18n.language);
  const compactTeamArena = tabLayoutWidth < COMPACT_TEAM_ARENA_BREAKPOINT;
  const geminiModalCardSizing = useMemo(
    () => modalCardSizingStyle(windowWidth, { maxWidth: 640 }),
    [windowWidth],
  );

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [geminiModalVisible, setGeminiModalVisible] = useState(false);
  const [geminiPaste, setGeminiPaste] = useState('');
  const [teamScan, setTeamScan] = useState<GeminiManualTeamScanV1 | null>(null);
  const [geminiModalError, setGeminiModalError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const [ourTeamSlots, setOurTeamSlots] = useState<TeamSlotFetch[]>([]);
  const [rivalTeamSlots, setRivalTeamSlots] = useState<TeamSlotFetch[]>([]);
  const [changeSlotTarget, setChangeSlotTarget] = useState<ChangeSlotTarget | null>(null);
  const [compactTeamTab, setCompactTeamTab] = useState<'ours' | 'rival'>('ours');
  const [scrollToTeamsRequestId, setScrollToTeamsRequestId] = useState(0);
  /** Se incrementa en el padre al terminar la carga en móvil; el shell solo reacciona (evita perder la transición anyLoading). */
  const [compactPeekSignal, setCompactPeekSignal] = useState(0);
  const prevAnyLoadingForCompactPeekRef = useRef<boolean | null>(null);

  const mainScrollRef = useRef<ScrollView>(null);
  const lastHandledWideScrollToTeamsRef = useRef(0);

  const onWideTeamsSectionLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (compactTeamArena || !teamScan) {
        return;
      }
      if (scrollToTeamsRequestId <= lastHandledWideScrollToTeamsRef.current) {
        return;
      }
      lastHandledWideScrollToTeamsRef.current = scrollToTeamsRequestId;
      const y = e.nativeEvent.layout.y;
      InteractionManager.runAfterInteractions(() => {
        mainScrollRef.current?.scrollTo({ y, animated: true });
      });
    },
    [compactTeamArena, teamScan, scrollToTeamsRequestId],
  );

  const copyGeminiPrompt = useCallback(async () => {
    await Clipboard.setStringAsync(GEMINI_TEAM_SCAN_PROMPT);
    setCopyHint(t('battle.promptCopied'));
    setTimeout(() => setCopyHint(null), 2500);
  }, [t]);

  const openGeminiWeb = useCallback(() => {
    void WebBrowser.openBrowserAsync('https://gemini.google.com/app');
  }, []);

  const applyGeminiResponse = useCallback(() => {
    setGeminiModalError(null);
    try {
      const parsed = parseGeminiTeamScanResponse(geminiPaste);
      setTeamScan(parsed);
      setGeminiPaste('');
      setGeminiModalVisible(false);
      setScrollToTeamsRequestId((n) => n + 1);
    } catch (e) {
      setGeminiModalError(e instanceof Error ? e.message : t('battle.parseError'));
    }
  }, [geminiPaste, t]);

  useEffect(() => {
    if (!teamScan) {
      setOurTeamSlots([]);
      setRivalTeamSlots([]);
      return;
    }

    const normSlotSlug = (raw: string) =>
      normalizePokemonNameQuery(raw) || raw.trim().toLowerCase();

    const ourInit: TeamSlotFetch[] = teamScan.nuestro_equipo.map((slug) => {
      const key = normSlotSlug(slug);
      return { slug: key, formSlug: key, loading: true, error: null, data: null };
    });
    const rivalInit: TeamSlotFetch[] = teamScan.rival.map((slug) => {
      const key = normSlotSlug(slug);
      return { slug: key, formSlug: key, loading: true, error: null, data: null };
    });

    setOurTeamSlots(ourInit);
    setRivalTeamSlots(rivalInit);

    let cancelled = false;

    async function fetchSide(
      rows: TeamSlotFetch[],
      setter: Dispatch<SetStateAction<TeamSlotFetch[]>>,
    ) {
      await Promise.all(
        rows.map(async (row, index) => {
          const query = row.formSlug;
          try {
            const data = await defaultPokemonRepository.getByName(query, { pokeApiLanguage });
            if (!cancelled) {
              setter((prev) =>
                prev.map((r, i) => (i === index ? { ...r, loading: false, error: null, data } : r)),
              );
            }
          } catch (e) {
            let message = t('battle.errorLoad');
            if (e instanceof PokemonNotFoundError) {
              message = t('battle.errorNotFound', { query });
            } else if (e instanceof PokemonNetworkError) {
              message = t('battle.errorNetwork');
            }
            if (!cancelled) {
              setter((prev) =>
                prev.map((r, i) =>
                  i === index ? { ...r, loading: false, error: message, data: null } : r,
                ),
              );
            }
          }
        }),
      );
    }

    void Promise.all([
      fetchSide(ourInit, setOurTeamSlots),
      fetchSide(rivalInit, setRivalTeamSlots),
    ]);

    return () => {
      cancelled = true;
    };
  }, [teamScan, pokeApiLanguage, t]);

  useEffect(() => {
    if (!teamScan) {
      setCompactTeamTab('ours');
    }
  }, [teamScan]);

  const loadFormSlugsForModal = useCallback(
    (slug: string) => defaultPokemonRepository.listFormSlugsForPokemonQuery(slug),
    [],
  );

  const applySlotSlug = useCallback((side: 'our' | 'rival', index: number, newSlug: string) => {
    const key = normalizePokemonNameQuery(newSlug);
    if (!key) {
      return;
    }
    const setter = side === 'our' ? setOurTeamSlots : setRivalTeamSlots;
    setter((prev) =>
      prev.map((row, i) =>
        i === index ? { slug: key, formSlug: key, loading: true, error: null, data: null } : row,
      ),
    );
    void (async () => {
      try {
        const data = await defaultPokemonRepository.getByName(key, { pokeApiLanguage });
        setter((prev) =>
          prev.map((row, i) =>
            i === index
              ? { ...row, slug: key, formSlug: key, loading: false, error: null, data }
              : row,
          ),
        );
      } catch (e) {
        let message = t('battle.errorLoad');
        if (e instanceof PokemonNotFoundError) {
          message = t('battle.errorNotFound', { query: key });
        } else if (e instanceof PokemonNetworkError) {
          message = t('battle.errorNetwork');
        }
        setter((prev) =>
          prev.map((row, i) =>
            i === index
              ? { ...row, slug: key, formSlug: key, loading: false, error: message, data: null }
              : row,
          ),
        );
      }
    })();
  }, [pokeApiLanguage, t]);

  const selectBattleFormSlug = useCallback((side: 'our' | 'rival', index: number, newSlug: string) => {
    const setter = side === 'our' ? setOurTeamSlots : setRivalTeamSlots;
    let previousFormSlug = '';
    setter((prev) => {
      previousFormSlug = prev[index]?.formSlug ?? '';
      return prev.map((row, i) =>
        i === index ? { ...row, formSlug: newSlug, loading: true, error: null } : row,
      );
    });
    void (async () => {
      try {
        const data = await defaultPokemonRepository.getByName(newSlug, { pokeApiLanguage });
        setter((prev) =>
          prev.map((row, i) =>
            i === index ? { ...row, loading: false, error: null, data } : row,
          ),
        );
      } catch (e) {
        let message = t('battle.errorLoad');
        if (e instanceof PokemonNotFoundError) {
          message = t('battle.errorNotFound', { query: newSlug });
        } else if (e instanceof PokemonNetworkError) {
          message = t('battle.errorNetwork');
        }
        setter((prev) =>
          prev.map((row, i) =>
            i === index
              ? { ...row, formSlug: previousFormSlug, loading: false, error: message }
              : row,
          ),
        );
      }
    })();
  }, [pokeApiLanguage, t]);

  const anyLoading = ourTeamSlots.some((s) => s.loading) || rivalTeamSlots.some((s) => s.loading);

  useEffect(() => {
    if (!teamScan || !compactTeamArena) {
      prevAnyLoadingForCompactPeekRef.current = null;
      return;
    }
    const prev = prevAnyLoadingForCompactPeekRef.current;
    if (prev === null) {
      prevAnyLoadingForCompactPeekRef.current = anyLoading;
      return;
    }
    const shouldPeek = prev === true && !anyLoading && compactTeamTab === 'ours';
    prevAnyLoadingForCompactPeekRef.current = anyLoading;
    if (!shouldPeek) {
      return;
    }
    const id = setTimeout(() => {
      setCompactPeekSignal((n) => n + 1);
    }, 0);
    return () => clearTimeout(id);
  }, [teamScan, compactTeamArena, anyLoading, compactTeamTab]);

  const ourTeamColumn = (
    <View
      style={[
        styles.columnBase,
        compactTeamArena ? styles.columnFullWidth : styles.columnInRow,
        styles.columnOurs,
      ]}
    >
      <Text style={styles.columnTitleOurs}>{t('battle.columnOurs')}</Text>
      {ourTeamSlots.length === 0 ? (
        <Text style={styles.emptyColumn}>{t('battle.emptyColumn')}</Text>
      ) : (
        ourTeamSlots.map((row, i) => (
          <TeamPokemonBattleCard
            key={`our-${i}`}
            slot={i + 1}
            slug={row.slug}
            formSlug={row.formSlug}
            loading={row.loading}
            error={row.error}
            summary={row.data}
            variant="ours"
            onPressChangePokemon={() =>
              setChangeSlotTarget({ side: 'our', index: i, slug: row.slug })
            }
            onSelectFormSlug={(s) => selectBattleFormSlug('our', i, s)}
            compareOpponents={rivalTeamSlots.map((r, j) => ({
              slot: j + 1,
              displayName: r.data?.displayName ?? formatPokemonSlugAsTitle(r.slug),
              spriteUrl: r.data?.spriteUrl ?? null,
              stats: r.data?.stats ?? null,
              loading: r.loading,
              error: r.error,
            }))}
            compareOtherColumnLabel={t('battle.columnRival')}
          />
        ))
      )}
    </View>
  );

  const rivalTeamColumn = (
    <View
      style={[
        styles.columnBase,
        compactTeamArena ? styles.columnFullWidth : styles.columnInRow,
        styles.columnRival,
      ]}
    >
      <Text style={styles.columnTitleRival}>{t('battle.columnRival')}</Text>
      {rivalTeamSlots.length === 0 ? (
        <Text style={styles.emptyColumn}>{t('battle.emptyColumn')}</Text>
      ) : (
        rivalTeamSlots.map((row, i) => (
          <TeamPokemonBattleCard
            key={`rival-${i}`}
            slot={i + 1}
            slug={row.slug}
            formSlug={row.formSlug}
            loading={row.loading}
            error={row.error}
            summary={row.data}
            variant="rival"
            onPressChangePokemon={() =>
              setChangeSlotTarget({ side: 'rival', index: i, slug: row.slug })
            }
            onSelectFormSlug={(s) => selectBattleFormSlug('rival', i, s)}
            compareOpponents={ourTeamSlots.map((r, j) => ({
              slot: j + 1,
              displayName: r.data?.displayName ?? formatPokemonSlugAsTitle(r.slug),
              spriteUrl: r.data?.spriteUrl ?? null,
              stats: r.data?.stats ?? null,
              loading: r.loading,
              error: r.error,
            }))}
            compareOtherColumnLabel={t('battle.columnOurs')}
          />
        ))
      )}
    </View>
  );

  const renderOnboardingBlock = (preloadCentered: boolean) => {
    const c = preloadCentered ? styles.preloadCenterText : undefined;
    const titleEl = preloadCentered ? (
      <View style={styles.preloadTitleBand}>
        <Pressable
          style={styles.preloadSettingsBtn}
          onPress={() => setSettingsModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('settings.openA11y')}
        >
          <Ionicons name="settings-outline" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.screenTitle, styles.preloadScreenTitle, c]}>{t('battle.screenTitle')}</Text>
      </View>
    ) : (
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>{t('battle.screenTitle')}</Text>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => setSettingsModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('settings.openA11y')}
        >
          <Ionicons name="settings-outline" size={26} color={theme.colors.text} />
        </Pressable>
      </View>
    );

    const btnRandomStyle = preloadCentered
      ? [styles.randomDemoBtn, styles.preloadFullWidthBtn]
      : styles.randomDemoBtn;
    const btnPrimaryStyle = preloadCentered
      ? [styles.primaryBtn, styles.preloadFullWidthBtn]
      : styles.primaryBtn;

    return (
      <>
        {titleEl}
        <Text style={[styles.lead, c]}>{t('battle.lead')}</Text>

        <Text style={[styles.heroExampleCaption, c]}>{t('battle.heroExampleCaption')}</Text>
        <View style={[styles.heroExampleImageWrap, preloadCentered && styles.preloadHeroImageWrap]}>
          <Image
            source={GEMINI_TEAM_SCAN_EXAMPLE_SOURCE}
            style={styles.heroExampleImage}
            resizeMode="contain"
            accessibilityLabel={t('battle.heroExampleA11y')}
          />
        </View>

        <Pressable
          style={btnRandomStyle}
          onPress={() => {
            setTeamScan(randomDemoTeamScan());
            setScrollToTeamsRequestId((n) => n + 1);
          }}
        >
          <Text style={styles.randomDemoBtnText}>{t('battle.randomDemo')}</Text>
        </Pressable>

        <Pressable
          style={btnPrimaryStyle}
          onPress={() => {
            setGeminiModalError(null);
            setGeminiModalVisible(true);
          }}
        >
          <Text style={styles.primaryBtnText}>{t('battle.importJson')}</Text>
        </Pressable>
      </>
    );
  };

  const loadingBannerEl =
    teamScan && anyLoading ? (
      <View style={styles.loadingBanner}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>{t('battle.loadingPokeapi')}</Text>
      </View>
    ) : null;

  const clearTeamsPressable = teamScan ? (
    <Pressable
      style={[styles.ghostBtn, compactTeamArena && styles.ghostBtnBelowTeam]}
      onPress={() => {
        setTeamScan(null);
        setOurTeamSlots([]);
        setRivalTeamSlots([]);
      }}
    >
      <Text style={styles.ghostBtnText}>{t('battle.clearTeams')}</Text>
    </Pressable>
  ) : null;

  const scrollBodyDefault = (
    <>
      {renderOnboardingBlock(false)}
      {teamScan ? (
        <>
          <View onLayout={onWideTeamsSectionLayout}>
            {loadingBannerEl}
            {!compactTeamArena ? (
              <View style={styles.arena}>
                {ourTeamColumn}
                {rivalTeamColumn}
              </View>
            ) : null}
          </View>
          {clearTeamsPressable}
        </>
      ) : (
        <Text style={styles.emptyHint}>{t('battle.emptyHint')}</Text>
      )}
    </>
  );

  const compactContentWidth = Math.max(0, tabLayoutWidth - 32);

  const webDesktopTeamsSplit =
    Boolean(teamScan) && isWebDesktopSplitLayout && !compactTeamArena;

  /** Web ancho y sin equipos: bloque onboarding centrado verticalmente al 30 % del ancho. */
  const showPreloadCenteredEmpty = !teamScan && isWebDesktopSplitLayout;

  return (
    <>
      <SettingsModal visible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} />
      {teamScan && compactTeamArena ? (
        <CompactTeamMobileShell
          contentWidth={compactContentWidth}
          scrollContentStyle={[styles.scroll, styles.scrollCompactWithTeams]}
          tabBarPaddingBottom={Math.max(insets.bottom, 10)}
          tab={compactTeamTab}
          onTabChange={setCompactTeamTab}
          peekSignal={compactPeekSignal}
          oursLabel={t('battle.columnOurs')}
          rivalLabel={t('battle.columnRival')}
          oursColumn={ourTeamColumn}
          rivalColumn={rivalTeamColumn}
          scrollToTeamsRequestId={scrollToTeamsRequestId}
          leadingScrollContent={
            <>
              {renderOnboardingBlock(false)}
              {loadingBannerEl}
            </>
          }
          trailingScrollContent={clearTeamsPressable}
        />
      ) : webDesktopTeamsSplit ? (
        <View style={styles.desktopSplitRoot}>
          <ScrollView
            style={styles.desktopSplitScrollPreview}
            contentContainerStyle={[styles.scroll, styles.desktopSplitPaneContent]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {renderOnboardingBlock(false)}
          </ScrollView>
          <ScrollView
            ref={mainScrollRef}
            style={styles.desktopSplitScrollTeams}
            contentContainerStyle={[styles.scroll, styles.desktopSplitPaneContent]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View onLayout={onWideTeamsSectionLayout}>
              {loadingBannerEl}
              <View style={styles.arena}>
                {ourTeamColumn}
                {rivalTeamColumn}
              </View>
            </View>
            {clearTeamsPressable}
          </ScrollView>
        </View>
      ) : showPreloadCenteredEmpty ? (
        <View style={styles.preloadRoot}>
          <ScrollView
            style={styles.preloadScroll}
            contentContainerStyle={styles.preloadScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View style={styles.preloadColumn}>
              {renderOnboardingBlock(true)}
              <Text style={[styles.emptyHint, styles.preloadCenterText]}>{t('battle.emptyHint')}</Text>
            </View>
          </ScrollView>
        </View>
      ) : (
        <ScrollView
          ref={mainScrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {scrollBodyDefault}
        </ScrollView>
      )}

      <ChangePokemonModal
        visible={changeSlotTarget !== null}
        onClose={() => setChangeSlotTarget(null)}
        currentSlug={changeSlotTarget?.slug ?? ''}
        contextLabel={
          changeSlotTarget
            ? changeSlotTarget.side === 'our'
              ? t('battle.changeContextOur', { slot: changeSlotTarget.index + 1 })
              : t('battle.changeContextRival', { slot: changeSlotTarget.index + 1 })
            : ''
        }
        variant={changeSlotTarget?.side === 'our' ? 'ours' : 'rival'}
        onLoadFormSlugs={loadFormSlugsForModal}
        onApplySlug={(newSlug) => {
          const target = changeSlotTarget;
          if (!target) {
            return;
          }
          applySlotSlug(target.side, target.index, newSlug);
        }}
      />

      <BackdropModal visible={geminiModalVisible} onClose={() => setGeminiModalVisible(false)}>
        <View style={styles.geminiModalBody}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View style={[styles.modalCard, geminiModalCardSizing]}>
              <Text style={styles.modalTitle}>{t('battle.geminiModalTitle')}</Text>
              <Text style={styles.modalStep}>{t('battle.geminiStep1')}</Text>
              <Text style={styles.modalStep}>{t('battle.geminiStep2')}</Text>
              <Text style={styles.modalExampleCaption}>{t('battle.geminiExampleCaption')}</Text>
              <View style={styles.modalExampleImageWrap}>
                <Image
                  source={GEMINI_TEAM_SCAN_EXAMPLE_SOURCE}
                  style={styles.modalExampleImage}
                  resizeMode="contain"
                  accessibilityLabel={t('battle.heroExampleA11y')}
                />
              </View>
              <Text style={styles.modalStep}>{t('battle.geminiStep3')}</Text>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => void copyGeminiPrompt()}>
                  <Text style={styles.secondaryBtnText}>{t('battle.copyPrompt')}</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={openGeminiWeb}>
                  <Text style={styles.secondaryBtnText}>{t('battle.openGemini')}</Text>
                </Pressable>
              </View>
              {copyHint ? <Text style={styles.copyHint}>{copyHint}</Text> : null}

              <Text style={styles.modalLabel}>{t('battle.geminiJsonLabel')}</Text>
              <TextInput
                style={styles.modalTextArea}
                value={geminiPaste}
                onChangeText={setGeminiPaste}
                placeholder='{"version":1,"nuestro_equipo":[],"rival":[]}'
                placeholderTextColor={theme.colors.textMuted}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />

              {geminiModalError ? <Text style={styles.error}>{geminiModalError}</Text> : null}

              <Pressable
                style={[styles.primaryBtn, !geminiPaste.trim() && styles.disabled]}
                onPress={applyGeminiResponse}
                disabled={!geminiPaste.trim()}
              >
                <Text style={styles.primaryBtnText}>{t('battle.applyResponse')}</Text>
              </Pressable>
              <Pressable style={styles.modalClose} onPress={() => setGeminiModalVisible(false)}>
                <Text style={styles.modalCloseText}>{t('battle.close')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </BackdropModal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    padding: theme.space.xl,
    paddingBottom: theme.space.bottomXL,
  },
  /** Web ≥900px: previa + acciones a la izquierda, equipos a la derecha. */
  desktopSplitRoot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.space.lg,
    minHeight: 0,
  },
  /** Prevía + botones: 30 % del ancho del área de split. */
  desktopSplitScrollPreview: {
    width: '30%',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  /** Columna de equipos: resto del ancho. */
  desktopSplitScrollTeams: {
    flex: 1,
    minWidth: 0,
  },
  desktopSplitPaneContent: {
    flexGrow: 1,
  },
  /** Sin equipos en web ancho: columna al 30 %, contenido centrado en el eje vertical. */
  preloadRoot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  preloadScroll: {
    flex: 1,
  },
  preloadScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.space.xxl,
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.bottomXL,
  },
  preloadColumn: {
    width: '30%',
    minWidth: 240,
    alignItems: 'center',
  },
  preloadCenterText: {
    textAlign: 'center',
  },
  preloadTitleBand: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.sm,
    minHeight: 40,
  },
  preloadSettingsBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: theme.space.xs,
    zIndex: 1,
  },
  preloadScreenTitle: {
    flex: 0,
    width: '100%',
    paddingRight: 36,
    textAlign: 'center',
  },
  preloadFullWidthBtn: {
    alignSelf: 'stretch',
    width: '100%',
  },
  preloadHeroImageWrap: {
    alignSelf: 'stretch',
  },
  /** Aire al final al haber barra de pestañas de equipos fija abajo. */
  scrollCompactWithTeams: {
    paddingBottom: theme.space.bottomTab,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.md,
    marginBottom: theme.space.sm,
  },
  screenTitle: {
    flex: 1,
    fontSize: theme.fontSize.heroLg,
    fontWeight: '800',
    color: theme.colors.text,
    paddingRight: theme.space.sm,
  },
  settingsBtn: {
    padding: theme.space.xs,
    marginTop: 2,
  },
  lead: {
    fontSize: theme.fontSize.titleSm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.space.xl,
  },
  heroExampleCaption: {
    fontSize: theme.fontSize.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.space.sm,
  },
  heroExampleImageWrap: {
    width: '100%',
    marginBottom: theme.space.xxxl,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutralSurface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 160,
  },
  heroExampleImage: {
    width: '100%',
    height: 200,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: theme.space.md,
  },
  randomDemoBtn: {
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: theme.space.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  randomDemoBtnText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.fontSize.title,
  },
  primaryBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: theme.fontSize.title,
  },
  disabled: {
    opacity: 0.5,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginBottom: theme.space.mdLg,
    padding: theme.space.mdLg,
    backgroundColor: theme.colors.oursBgSoft,
    borderRadius: theme.radius.lg,
  },
  loadingText: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.bannerInfoText,
    flex: 1,
  },
  arena: {
    flexDirection: 'row',
    gap: theme.space.md,
    alignItems: 'flex-start',
  },
  /** Sin flex: evita colapso de altura (flexBasis 0) que superpone el bloque siguiente en ScrollView. */
  columnBase: {
    minWidth: 0,
    borderRadius: theme.radius.xl,
    padding: theme.space.md,
    paddingTop: theme.space.mdLg,
  },
  columnInRow: {
    flex: 1,
  },
  columnFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  columnOurs: {
    backgroundColor: theme.colors.oursBgSoft,
  },
  columnRival: {
    backgroundColor: theme.colors.rivalBgSoft,
  },
  columnTitleOurs: {
    fontSize: theme.fontSize.titleSm,
    fontWeight: '800',
    color: theme.colors.oursAccent,
    textAlign: 'center',
    marginBottom: theme.space.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnTitleRival: {
    fontSize: theme.fontSize.titleSm,
    fontWeight: '800',
    color: theme.colors.rivalAccent,
    textAlign: 'center',
    marginBottom: theme.space.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyColumn: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.space.mdLg,
  },
  emptyHint: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.space.section,
    paddingHorizontal: theme.space.sm,
  },
  ghostBtn: {
    alignSelf: 'center',
    marginTop: theme.space.xl,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.mdLg,
  },
  ghostBtnBelowTeam: {
    marginTop: theme.space.xxxl,
  },
  ghostBtnText: {
    color: theme.colors.link,
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.space.mdLg,
  },
  secondaryBtn: {
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondaryControlBg,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.text,
  },
  geminiModalBody: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.space.xl,
    pointerEvents: 'box-none',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    paddingBottom: theme.space.bottomLg,
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.space.xxl,
  },
  modalTitle: {
    fontSize: theme.fontSize.screenTitle,
    fontWeight: '700',
    marginBottom: theme.space.mdLg,
    color: theme.colors.text,
  },
  modalStep: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.textSecondary,
    marginBottom: theme.space.sm,
    lineHeight: 20,
  },
  modalExampleCaption: {
    fontSize: theme.fontSize.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.space.xs,
    marginBottom: theme.space.smd,
  },
  modalExampleImageWrap: {
    width: '100%',
    marginBottom: theme.space.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutralSurface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 160,
  },
  modalExampleImage: {
    width: '100%',
    height: 200,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
    marginTop: theme.space.sm,
    marginBottom: theme.space.sm,
  },
  copyHint: {
    fontSize: theme.fontSize.body,
    color: theme.colors.success,
    marginBottom: theme.space.sm,
    fontWeight: '600',
  },
  modalLabel: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '600',
    marginBottom: theme.space.smd,
    marginTop: theme.space.sm,
    color: theme.colors.text,
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.mdLg,
    paddingVertical: theme.space.md,
    fontSize: theme.fontSize.bodyLg,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    marginBottom: theme.space.mdLg,
    color: theme.colors.text,
  },
  modalClose: {
    alignSelf: 'center',
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.xl,
  },
  modalCloseText: {
    color: theme.colors.link,
    fontSize: theme.fontSize.titleSm,
    fontWeight: '600',
  },
}));
