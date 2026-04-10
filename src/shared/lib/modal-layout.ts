import type { ViewStyle } from 'react-native';

/**
 * Por debajo de este ancho el panel del modal sigue ocupando todo el hueco horizontal
 * (con el padding del backdrop). A partir de aquí se limita el ancho y se centra.
 * Alineado con `COMPACT_TEAM_ARENA_BREAKPOINT` en la pantalla de escaneo.
 */
export const MODAL_WIDE_LAYOUT_MIN_WIDTH = 640;

const DEFAULT_MAX = 560;
const HORIZONTAL_BACKDROP_PADDING = 32;

/**
 * Estilo para la tarjeta de un modal en tablet / escritorio / web: ancho máximo y centrado.
 */
export function modalCardSizingStyle(
  windowWidth: number,
  options?: { maxWidth?: number },
): ViewStyle | undefined {
  if (windowWidth < MODAL_WIDE_LAYOUT_MIN_WIDTH) {
    return undefined;
  }
  const cap = options?.maxWidth ?? DEFAULT_MAX;
  return {
    width: '100%',
    maxWidth: Math.min(cap, windowWidth - HORIZONTAL_BACKDROP_PADDING),
    alignSelf: 'center',
  };
}
