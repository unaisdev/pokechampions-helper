import type { ViewStyle } from 'react-native';

/**
 * Por debajo de este ancho el panel del modal sigue ocupando todo el hueco horizontal
 * (con el padding del backdrop). A partir de aquí se limita el ancho y se centra.
 * Alineado con `COMPACT_TEAM_ARENA_BREAKPOINT` en la pantalla de escaneo.
 */
export const MODAL_WIDE_LAYOUT_MIN_WIDTH = 640;

const DEFAULT_MAX = 560;
const HORIZONTAL_BACKDROP_PADDING = 32;

export type ModalCardSizingOptions = {
  maxWidth?: number;
  /** Porcentaje del ancho de ventana (p. ej. 35 → 35%). Tiene prioridad sobre `maxWidth`. */
  widthPercent?: number;
};

/**
 * Estilo para la tarjeta de un modal en tablet / escritorio / web: ancho máximo y centrado.
 */
export function modalCardSizingStyle(
  windowWidth: number,
  options?: ModalCardSizingOptions,
): ViewStyle | undefined {
  if (windowWidth < MODAL_WIDE_LAYOUT_MIN_WIDTH) {
    return undefined;
  }
  const inner = windowWidth - HORIZONTAL_BACKDROP_PADDING;
  if (options?.widthPercent != null) {
    const fromPct = (options.widthPercent / 100) * windowWidth;
    return {
      width: '100%',
      maxWidth: Math.min(fromPct, inner),
      alignSelf: 'center',
    };
  }
  const cap = options?.maxWidth ?? DEFAULT_MAX;
  return {
    width: '100%',
    maxWidth: Math.min(cap, inner),
    alignSelf: 'center',
  };
}
