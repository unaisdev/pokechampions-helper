import type { ReactNode } from 'react';
import { Platform, useWindowDimensions, View, type ViewProps } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

/** Mismo criterio que `COMPACT_TEAM_ARENA_BREAKPOINT` / modales anchos: por encima, columna centrada en web. */
export const TAB_SCREEN_DESKTOP_MIN_WIDTH = 640;

/** Columna estrecha en escritorio (solo el cuerpo del tab; barra de tabs y cabecera siguen a ancho completo). */
export const TAB_SCREEN_DESKTOP_MAX_WIDTH = 520;

/** A partir de este ancho en web el contenido del tab usa todo el ancho (p. ej. dos columnas en escaneo). */
export const WEB_DESKTOP_SPLIT_MIN_WIDTH = 900;

type TabScreenContentFrameProps = ViewProps & {
  children: ReactNode;
  /** Fondo de las bandas laterales en escritorio; debe coincidir con el fondo principal del contenido. */
  outerBackgroundColor?: string;
};

/**
 * En web con ventana ancha, limita y centra el contenido del tab.
 * En nativo o ventana estrecha, el hijo ocupa todo el ancho como antes.
 */
export function TabScreenContentFrame({
  children,
  style,
  outerBackgroundColor,
  ...rest
}: TabScreenContentFrameProps) {
  const { width } = useWindowDimensions();
  const { theme } = useUnistyles();
  /** Columna centrada solo entre 640px y el umbral de split; si no, ancho completo. */
  const useNarrowCenteredFrame =
    Platform.OS === 'web' &&
    width >= TAB_SCREEN_DESKTOP_MIN_WIDTH &&
    width < WEB_DESKTOP_SPLIT_MIN_WIDTH;
  const gutterBg = outerBackgroundColor ?? theme.colors.background;

  if (!useNarrowCenteredFrame) {
    return (
      <View style={[{ flex: 1 }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[{ flex: 1, alignItems: 'center', backgroundColor: gutterBg }, style]}
      {...rest}
    >
      <View style={{ flex: 1, width: '100%', maxWidth: TAB_SCREEN_DESKTOP_MAX_WIDTH }}>
        {children}
      </View>
    </View>
  );
}
