import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
      ? { border: '#2563eb', chipBg: '#eff6ff', chipBorder: '#93c5fd' }
      : { border: '#dc2626', chipBg: '#fef2f2', chipBorder: '#fecaca' };

  const showVariantSection = !loadingForms && formSlugs.length > 1;

  const pickForm = (slug: string) => {
    onApplySlug(slug);
    onClose();
  };

  const submitSearch = () => {
    const key = normalizePokemonNameQuery(search);
    if (!key) {
      setSearchError('Escribe un nombre o slug de PokéAPI.');
      return;
    }
    setSearchError(null);
    onApplySlug(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { borderTopColor: accent.border }]}>
            <Text style={styles.title}>Cambiar Pokémon</Text>
            <Text style={styles.context}>{contextLabel}</Text>
            <Text style={styles.hint}>
              Si hay varias formas en PokéAPI, elige una abajo. Si quieres otro Pokémon distinto, usa el
              buscador.
            </Text>

            {loadingForms ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Cargando formas disponibles…</Text>
              </View>
            ) : null}

            {showVariantSection ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Formas disponibles</Text>
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
                        {selected ? ' · actual' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Buscar Pokémon</Text>
              <Text style={styles.searchHint}>
                Nombre en inglés o slug de PokéAPI (ej. charizard, palafin-hero).
              </Text>
              <TextInput
                style={styles.input}
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setSearchError(null);
                }}
                placeholder="Ej. palafin-hero"
                placeholderTextColor="#71717a"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={submitSearch}
              />
              {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
              <Pressable style={styles.primaryBtn} onPress={submitSearch}>
                <Text style={styles.primaryBtnText}>Buscar y aplicar</Text>
              </Pressable>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  scroll: {
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderTopWidth: 4,
    borderTopColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 4,
  },
  context: {
    fontSize: 14,
    fontWeight: '600',
    color: '#52525b',
    marginBottom: 10,
  },
  hint: {
    fontSize: 13,
    color: '#3f3f46',
    lineHeight: 19,
    marginBottom: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 14,
    color: '#52525b',
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 8,
  },
  formChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  formChipSelected: {
    borderWidth: 2,
  },
  formChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27272a',
  },
  formChipTextSelected: {
    color: '#18181b',
  },
  searchHint: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 8,
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    fontSize: 15,
    marginBottom: 8,
    color: '#18181b',
  },
  error: {
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  closeBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  closeBtnText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
});
