import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraViewRef } from 'expo-camera';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';
import { defaultPokemonRepository } from '@src/shared/api';

export function BattleScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewRef>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pokemon, setPokemon] = useState<PokemonSummary | null>(null);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady) return;
    try {
      const photo = await cameraRef.current.takePicture({ quality: 0.85 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch {
      setError('No se pudo capturar la foto.');
    }
  }, [cameraReady]);

  const lookup = useCallback(async () => {
    setError(null);
    setPokemon(null);
    setLoading(true);
    try {
      const result = await defaultPokemonRepository.getByName(nameInput);
      setPokemon(result);
    } catch (e) {
      if (e instanceof PokemonNotFoundError) {
        setError('No se encontró ese Pokémon en PokéAPI. Revisa el nombre.');
      } else if (e instanceof PokemonNetworkError) {
        setError('Error de red. Comprueba la conexión e inténtalo de nuevo.');
      } else {
        setError('Algo salió mal.');
      }
    } finally {
      setLoading(false);
    }
  }, [nameInput]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>Necesitamos acceso a la cámara para fotografiar el resumen de batalla.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => requestPermission()}>
          <Text style={styles.primaryBtnText}>Permitir cámara</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.cameraBox}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, !cameraReady && styles.disabled]}
        onPress={takePicture}
        disabled={!cameraReady}>
        <Text style={styles.primaryBtnText}>Capturar foto</Text>
      </Pressable>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.thumb} accessibilityLabel="Vista previa de la captura" />
      ) : null}

      <Text style={styles.label}>
        Nombre del Pokémon (manual hasta integrar OCR on-device)
      </Text>
      <TextInput
        style={styles.input}
        value={nameInput}
        onChangeText={setNameInput}
        placeholder="pikachu"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <Pressable
        style={[styles.primaryBtn, loading && styles.disabled]}
        onPress={lookup}
        disabled={loading || !nameInput.trim()}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Consultar PokéAPI</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {pokemon ? <PokemonSummaryCard summary={pokemon} /> : null}
    </ScrollView>
  );
}

function PokemonSummaryCard({ summary }: { summary: PokemonSummary }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{summary.name}</Text>
      {summary.spriteUrl ? (
        <Image source={{ uri: summary.spriteUrl }} style={styles.sprite} accessibilityLabel={summary.name} />
      ) : null}
      <Text style={styles.body}>Tipos: {summary.types.join(', ') || '—'}</Text>
      <Text style={styles.body}>
        Altura: {summary.heightDm / 10} m · Peso: {summary.weightHg / 10} kg
      </Text>
      <Text style={styles.subheading}>Stats base</Text>
      {summary.stats.map((s) => (
        <Text key={s.name} style={styles.statRow}>
          {s.name}: {s.baseStat}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  cameraBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.85,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  card: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    gap: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sprite: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 8,
  },
  body: {
    fontSize: 15,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  statRow: {
    fontSize: 14,
  },
});
