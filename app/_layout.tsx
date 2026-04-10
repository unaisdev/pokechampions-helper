import '@src/shared/theme/unistyles';
import '@src/shared/i18n';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { hydrateThemeFromStorage } from '@src/shared/theme/theme-preference';
import { useUnistyles } from 'react-native-unistyles';
import { vexo } from 'vexo-analytics';

// Initialize Vexo at the root level, outside of any component
// Recommended to wrap in production-only check
if (__DEV__ === false) {
  vexo('8c260369-8d30-4466-995c-614b9aa1c74b');
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void hydrateThemeFromStorage();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { theme, rt } = useUnistyles();
  /** `rt.colorScheme` sigue al sistema; `rt.themeName` sigue a Unistyles (preferencia guardada o sistema). */
  const navigationTheme = (rt.themeName ?? 'light') === 'dark' ? DarkTheme : DefaultTheme;

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.add('app-bootstrapped');
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    document.body.style.backgroundColor = theme.colors.background;
    document.documentElement.style.colorScheme = rt.themeName === 'dark' ? 'dark' : 'light';
  }, [theme.colors.background, rt.themeName]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
