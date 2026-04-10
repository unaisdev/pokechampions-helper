import { darkColors, lightColors, type AppColors } from './palettes';
import { fontSize, radius, space } from './tokens';

export type AppTheme = {
  colors: AppColors;
  space: typeof space;
  radius: typeof radius;
  fontSize: typeof fontSize;
};

const shell = { space, radius, fontSize } as const;

export const lightTheme: AppTheme = {
  colors: lightColors,
  ...shell,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  ...shell,
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    light: AppTheme;
    dark: AppTheme;
  }
}
