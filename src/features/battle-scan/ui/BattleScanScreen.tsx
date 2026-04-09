import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewProps,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import { defaultPokemonRepository } from '@src/shared/api';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';

const isWeb = Platform.OS === 'web';

/** Max height for camera / preview frame (native + web). */
const CAPTURE_FRAME_HEIGHT = 200;

function revokeIfBlob(uri: string | null) {
  if (uri?.startsWith('blob:')) {
    URL.revokeObjectURL(uri);
  }
}

export function BattleScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView>>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUriRef = useRef<string | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [webCameraMode, setWebCameraMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pokemon, setPokemon] = useState<PokemonSummary | null>(null);

  const setPhotoUriSafe = useCallback((uri: string | null) => {
    setPhotoUri((prev) => {
      revokeIfBlob(prev);
      if (uri?.startsWith('blob:')) {
        blobUriRef.current = uri;
      } else {
        blobUriRef.current = null;
      }
      return uri;
    });
  }, []);

  useEffect(() => {
    return () => revokeIfBlob(blobUriRef.current);
  }, []);

  const applyImageFile = useCallback(
    (file: File | null | undefined) => {
      if (!file || !file.type.startsWith('image/')) {
        setError('El archivo no es una imagen válida.');
        return;
      }
      setError(null);
      setWebCameraMode(false);
      setPhotoUriSafe(URL.createObjectURL(file));
    },
    [setPhotoUriSafe],
  );

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            applyImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [applyImageFile]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setPhotoUriSafe(photo.uri);
    } catch {
      setError('No se pudo capturar la foto.');
    }
  }, [cameraReady, setPhotoUriSafe]);

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

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const webDropHandlers: Partial<ViewProps> | Record<string, unknown> = isWeb
    ? {
        onDragOver: (e: { preventDefault?: () => void; dataTransfer?: DataTransfer }) => {
          e.preventDefault?.();
          setDragActive(true);
        },
        onDragLeave: () => setDragActive(false),
        onDrop: (e: {
          preventDefault?: () => void;
          dataTransfer?: DataTransfer;
          nativeEvent?: DragEvent;
        }) => {
          e.preventDefault?.();
          setDragActive(false);
          const dt = e.dataTransfer ?? e.nativeEvent?.dataTransfer;
          const file = dt?.files?.[0];
          applyImageFile(file ?? undefined);
        },
      }
    : {};

  const showNativePermissionGate = !isWeb && permission && !permission.granted;
  const showNativeLoading = !isWeb && !permission;

  /** Native: already past permission gate. Web: only when user opted into camera. */
  const canUseCameraInFrame = isWeb ? !!(webCameraMode && permission?.granted) : true;

  if (showNativeLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (showNativePermissionGate) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>
          Necesitamos acceso a la cámara para fotografiar el resumen de batalla.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => requestPermission()}>
          <Text style={styles.primaryBtnText}>Permitir cámara</Text>
        </Pressable>
      </View>
    );
  }

  const frameContent = (() => {
    if (photoUri) {
      return (
        <Image
          source={{ uri: photoUri }}
          style={styles.frameImage}
          accessibilityLabel="Vista previa de la captura"
        />
      );
    }
    if (canUseCameraInFrame && (!isWeb || webCameraMode)) {
      return (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
      );
    }
    if (isWeb) {
      return (
        <View style={styles.webPlaceholder}>
          <Text style={styles.webPlaceholderTitle}>Añade una captura</Text>
          <Text style={styles.webPlaceholderHint}>
            Arrastra una imagen aquí, pégala (Ctrl+V / ⌘+V), o usa los botones de abajo.
          </Text>
        </View>
      );
    }
    return null;
  })();

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {isWeb
        ? createElement('input', {
            ref: (el: HTMLInputElement | null) => {
              fileInputRef.current = el;
            },
            type: 'file',
            accept: 'image/*',
            style: { display: 'none' },
            onChange: (ev: { target: HTMLInputElement }) => {
              const f = ev.target.files?.[0];
              applyImageFile(f ?? undefined);
              ev.target.value = '';
            },
          } as never)
        : null}

      <View
        style={[styles.captureFrame, isWeb && dragActive ? styles.captureFrameDragActive : null]}
        {...(isWeb ? webDropHandlers : {})}
      >
        {frameContent}
      </View>

      {isWeb ? (
        <View style={styles.webActions}>
          <Pressable style={styles.secondaryBtn} onPress={openFilePicker}>
            <Text style={styles.secondaryBtnText}>Elegir imagen</Text>
          </Pressable>
          {!webCameraMode ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={async () => {
                setError(null);
                const r = await requestPermission();
                if (r.granted) {
                  setWebCameraMode(true);
                  setPhotoUriSafe(null);
                  setCameraReady(false);
                } else {
                  setError('Permiso de cámara denegado. Puedes usar archivo o pegar imagen.');
                }
              }}
            >
              <Text style={styles.secondaryBtnText}>Usar cámara</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setWebCameraMode(false);
                setCameraReady(false);
              }}
            >
              <Text style={styles.secondaryBtnText}>Sin cámara (archivo / pegar)</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {canUseCameraInFrame && (!isWeb || webCameraMode) ? (
        <Pressable
          style={[styles.primaryBtn, !cameraReady && styles.disabled]}
          onPress={takePicture}
          disabled={!cameraReady}
        >
          <Text style={styles.primaryBtnText}>Capturar foto</Text>
        </Pressable>
      ) : null}

      {photoUri && isWeb ? (
        <Pressable style={styles.ghostBtn} onPress={() => setPhotoUriSafe(null)}>
          <Text style={styles.ghostBtnText}>Quitar imagen</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>Nombre del Pokémon (manual hasta integrar OCR on-device)</Text>
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
        disabled={loading || !nameInput.trim()}
      >
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
        <Image
          source={{ uri: summary.spriteUrl }}
          style={styles.sprite}
          accessibilityLabel={summary.name}
        />
      ) : null}
      <View style={styles.typesRow}>
        <Text style={styles.typesLabel}>Tipos:</Text>
        {summary.types.length === 0 ? (
          <Text style={styles.body}>—</Text>
        ) : (
          <View style={styles.typeIcons}>
            {summary.types.map((t) => (
              <View key={t.name} style={styles.typeChip}>
                {t.iconUrl ? (
                  <Image
                    source={{ uri: t.iconUrl }}
                    style={styles.typeIcon}
                    accessibilityLabel={t.name}
                  />
                ) : (
                  <Text style={styles.typeNameFallback}>{t.name}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
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
  captureFrame: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    height: CAPTURE_FRAME_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 12,
  },
  captureFrameDragActive: {
    outlineWidth: 2,
    outlineColor: '#2563eb',
    outlineStyle: 'solid',
  },
  frameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  webPlaceholderTitle: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  webPlaceholderHint: {
    color: '#a1a1aa',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  webActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
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
  ghostBtn: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ghostBtnText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
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
  typesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typesLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  typeNameFallback: {
    fontSize: 14,
    textTransform: 'capitalize',
    opacity: 0.85,
  },
});
