import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';

const STORAGE_KEY = '@pokechampions/theme-preference';

let followSystem = true;

export function getFollowSystem(): boolean {
  return followSystem;
}

function setFollowSystem(value: boolean): void {
  followSystem = value;
}

function resolveFromAppearance(): 'light' | 'dark' {
  try {
    const scheme = Appearance.getColorScheme();
    return scheme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function hydrateThemeFromStorage(): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    setFollowSystem(false);
    UnistylesRuntime.setTheme(stored);
  } else {
    setFollowSystem(true);
    UnistylesRuntime.setTheme(resolveFromAppearance());
  }
}

export async function persistUserTheme(theme: 'light' | 'dark'): Promise<void> {
  setFollowSystem(false);
  await AsyncStorage.setItem(STORAGE_KEY, theme);
  UnistylesRuntime.setTheme(theme);
}
