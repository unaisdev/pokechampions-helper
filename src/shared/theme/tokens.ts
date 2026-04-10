/**
 * Layout tokens (density-independent px). Used inside Unistyles themes — prefer `theme.space` / `theme.radius` / `theme.fontSize` in styles.
 */
export const space = {
  xxs: 2,
  xs: 4,
  smd: 6,
  sm: 8,
  md: 10,
  mdLg: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  xxxl: 20,
  section: 24,
  bottomLg: 28,
  bottomXL: 32,
  bottomTab: 40,
} as const;

export const radius = {
  xs: 3,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  hero: 18,
  pill: 999,
} as const;

export const fontSize = {
  micro: 10,
  caption: 11,
  bodySm: 12,
  body: 13,
  bodyLg: 14,
  titleSm: 15,
  title: 16,
  modalTitle: 17,
  screenTitle: 18,
  hero: 20,
  heroLg: 22,
  display: 24,
} as const;

export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
export type FontSizeToken = keyof typeof fontSize;
