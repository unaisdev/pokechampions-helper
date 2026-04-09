import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import {
  GEMINI_TEAM_SCAN_PROMPT,
  parseGeminiTeamScanResponse,
  type GeminiManualTeamScanV1,
} from '@src/features/battle-scan/lib/gemini-manual-team-scan';
import { randomDemoTeamScan } from '@src/features/battle-scan/lib/random-demo-teams';
import { ChangePokemonModal } from '@src/features/battle-scan/ui/ChangePokemonModal';
import { TeamPokemonBattleCard } from '@src/features/battle-scan/ui/TeamPokemonBattleCard';
import { defaultPokemonRepository } from '@src/shared/api';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';
import { normalizePokemonNameQuery } from '@src/shared/lib/pokemon-name';

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
  const [geminiModalVisible, setGeminiModalVisible] = useState(false);
  const [geminiPaste, setGeminiPaste] = useState('');
  const [teamScan, setTeamScan] = useState<GeminiManualTeamScanV1 | null>(null);
  const [geminiModalError, setGeminiModalError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const [ourTeamSlots, setOurTeamSlots] = useState<TeamSlotFetch[]>([]);
  const [rivalTeamSlots, setRivalTeamSlots] = useState<TeamSlotFetch[]>([]);
  const [changeSlotTarget, setChangeSlotTarget] = useState<ChangeSlotTarget | null>(null);

  const copyGeminiPrompt = useCallback(async () => {
    await Clipboard.setStringAsync(GEMINI_TEAM_SCAN_PROMPT);
    setCopyHint('Prompt copiado al portapapeles');
    setTimeout(() => setCopyHint(null), 2500);
  }, []);

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
    } catch (e) {
      setGeminiModalError(e instanceof Error ? e.message : 'No se pudo leer la respuesta.');
    }
  }, [geminiPaste]);

  useEffect(() => {
    if (!teamScan) {
      setOurTeamSlots([]);
      setRivalTeamSlots([]);
      return;
    }

    const normSlotSlug = (raw: string) => normalizePokemonNameQuery(raw) || raw.trim().toLowerCase();

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
            const data = await defaultPokemonRepository.getByName(query);
            if (!cancelled) {
              setter((prev) =>
                prev.map((r, i) => (i === index ? { ...r, loading: false, error: null, data } : r)),
              );
            }
          } catch (e) {
            let message = 'No se pudo cargar.';
            if (e instanceof PokemonNotFoundError) {
              message = `PokéAPI: «${query}» no encontrado.`;
            } else if (e instanceof PokemonNetworkError) {
              message = 'Error de red al consultar PokéAPI.';
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

    void Promise.all([fetchSide(ourInit, setOurTeamSlots), fetchSide(rivalInit, setRivalTeamSlots)]);

    return () => {
      cancelled = true;
    };
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
        const data = await defaultPokemonRepository.getByName(key);
        setter((prev) =>
          prev.map((row, i) =>
            i === index
              ? { ...row, slug: key, formSlug: key, loading: false, error: null, data }
              : row,
          ),
        );
      } catch (e) {
        let message = 'No se pudo cargar.';
        if (e instanceof PokemonNotFoundError) {
          message = `PokéAPI: «${key}» no encontrado.`;
        } else if (e instanceof PokemonNetworkError) {
          message = 'Error de red al consultar PokéAPI.';
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
  }, []);

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
        const data = await defaultPokemonRepository.getByName(newSlug);
        setter((prev) =>
          prev.map((row, i) =>
            i === index ? { ...row, loading: false, error: null, data } : row,
          ),
        );
      } catch (e) {
        let message = 'No se pudo cargar.';
        if (e instanceof PokemonNotFoundError) {
          message = `PokéAPI: «${newSlug}» no encontrado.`;
        } else if (e instanceof PokemonNetworkError) {
          message = 'Error de red al consultar PokéAPI.';
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
  }, []);

  const anyLoading =
    ourTeamSlots.some((s) => s.loading) || rivalTeamSlots.some((s) => s.loading);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.screenTitle}>Previa de equipos</Text>
      <Text style={styles.lead}>
        Importa el JSON que generes en Gemini con la captura del juego. La app muestra ambos equipos
        como en la pantalla de combate, con datos de PokéAPI para cada Pokémon.
      </Text>

      <Text style={styles.heroExampleCaption}>
        Ejemplo de imagen para Gemini (tu equipo a la izquierda, rival a la derecha):
      </Text>
      <View style={styles.heroExampleImageWrap}>
        <Image
          source={GEMINI_TEAM_SCAN_EXAMPLE_SOURCE}
          style={styles.heroExampleImage}
          resizeMode="contain"
          accessibilityLabel="Ejemplo de pantalla previa de combate con dos columnas de Pokémon"
        />
      </View>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => {
          setGeminiModalError(null);
          setGeminiModalVisible(true);
        }}
      >
        <Text style={styles.primaryBtnText}>Importar JSON (Gemini)</Text>
      </Pressable>

      <Pressable
        style={styles.randomDemoBtn}
        onPress={() => setTeamScan(randomDemoTeamScan())}
      >
        <Text style={styles.randomDemoBtnText}>Probar con equipos aleatorios</Text>
      </Pressable>

      {teamScan ? (
        <>
          {anyLoading ? (
            <View style={styles.loadingBanner}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Cargando datos de PokéAPI…</Text>
            </View>
          ) : null}

          <View style={styles.arena}>
            <View style={[styles.column, styles.columnOurs]}>
              <Text style={styles.columnTitleOurs}>Nuestro equipo</Text>
              {ourTeamSlots.length === 0 ? (
                <Text style={styles.emptyColumn}>Sin Pokémon en el JSON</Text>
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
                  />
                ))
              )}
            </View>

            <View style={[styles.column, styles.columnRival]}>
              <Text style={styles.columnTitleRival}>Rival</Text>
              {rivalTeamSlots.length === 0 ? (
                <Text style={styles.emptyColumn}>Sin Pokémon en el JSON</Text>
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
                  />
                ))
              )}
            </View>
          </View>

          <Pressable
            style={styles.ghostBtn}
            onPress={() => {
              setTeamScan(null);
              setOurTeamSlots([]);
              setRivalTeamSlots([]);
            }}
          >
            <Text style={styles.ghostBtnText}>Borrar equipos importados</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.emptyHint}>
          Aún no hay equipos. Pulsa «Importar JSON» y pega la respuesta de Gemini.
        </Text>
      )}

      <ChangePokemonModal
        visible={changeSlotTarget !== null}
        onClose={() => setChangeSlotTarget(null)}
        currentSlug={changeSlotTarget?.slug ?? ''}
        contextLabel={
          changeSlotTarget
            ? `${changeSlotTarget.side === 'our' ? 'Nuestro equipo' : 'Rival'} — posición ${changeSlotTarget.index + 1}`
            : ''
        }
        variant={changeSlotTarget?.side === 'our' ? 'ours' : 'rival'}
        onLoadFormSlugs={loadFormSlugsForModal}
        onApplySlug={(newSlug) => {
          const t = changeSlotTarget;
          if (!t) {
            return;
          }
          applySlotSlug(t.side, t.index, newSlug);
        }}
      />

      <Modal
        visible={geminiModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGeminiModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Gemini — mismo formato JSON</Text>
              <Text style={styles.modalStep}>
                1) Pulsa «Copiar prompt» (instrucciones + formato que Gemini debe respetar).
              </Text>
              <Text style={styles.modalStep}>
                2) «Abrir Gemini», adjunta la captura del equipo y pega el prompt en el chat.
              </Text>
              <Text style={styles.modalExampleCaption}>
                Ejemplo del tipo de imagen (equipo izquierda / rival derecha):
              </Text>
              <View style={styles.modalExampleImageWrap}>
                <Image
                  source={GEMINI_TEAM_SCAN_EXAMPLE_SOURCE}
                  style={styles.modalExampleImage}
                  resizeMode="contain"
                  accessibilityLabel="Ejemplo de pantalla previa de combate con dos columnas de Pokémon"
                />
              </View>
              <Text style={styles.modalStep}>
                3) Cuando Gemini responda, copia solo el JSON y pégalo abajo; pulsa «Aplicar».
              </Text>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => void copyGeminiPrompt()}>
                  <Text style={styles.secondaryBtnText}>Copiar prompt</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={openGeminiWeb}>
                  <Text style={styles.secondaryBtnText}>Abrir Gemini</Text>
                </Pressable>
              </View>
              {copyHint ? <Text style={styles.copyHint}>{copyHint}</Text> : null}

              <Text style={styles.modalLabel}>Respuesta de Gemini (JSON)</Text>
              <TextInput
                style={styles.modalTextArea}
                value={geminiPaste}
                onChangeText={setGeminiPaste}
                placeholder='{"version":1,"nuestro_equipo":[],"rival":[]}'
                placeholderTextColor="#71717a"
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
                <Text style={styles.primaryBtnText}>Aplicar respuesta</Text>
              </Pressable>
              <Pressable style={styles.modalClose} onPress={() => setGeminiModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    color: '#52525b',
    lineHeight: 22,
    marginBottom: 16,
  },
  heroExampleCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
    marginBottom: 8,
  },
  heroExampleImageWrap: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    minHeight: 160,
  },
  heroExampleImage: {
    width: '100%',
    height: 200,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  randomDemoBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  randomDemoBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
  },
  arena: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    padding: 10,
    paddingTop: 12,
  },
  columnOurs: {
    backgroundColor: '#eff6ff',
  },
  columnRival: {
    backgroundColor: '#fef2f2',
  },
  columnTitleOurs: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnTitleRival: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyColumn: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: '#71717a',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  ghostBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ghostBtnText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e4e4e7',
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#18181b',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    paddingBottom: 28,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#18181b',
  },
  modalStep: {
    fontSize: 14,
    color: '#3f3f46',
    marginBottom: 8,
    lineHeight: 20,
  },
  modalExampleCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
    marginTop: 4,
    marginBottom: 6,
  },
  modalExampleImageWrap: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    minHeight: 160,
  },
  modalExampleImage: {
    width: '100%',
    height: 200,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  copyHint: {
    fontSize: 13,
    color: '#15803d',
    marginBottom: 8,
    fontWeight: '600',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
    color: '#18181b',
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    marginBottom: 12,
    color: '#18181b',
  },
  modalClose: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCloseText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
});
