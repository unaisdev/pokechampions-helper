import { Appearance } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';

import { getFollowSystem } from './theme-preference';
import { darkTheme, lightTheme } from './themes';

function resolveThemeName(): 'light' | 'dark' {
  try {
    const scheme = Appearance.getColorScheme();
    return scheme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  settings: {
    /**
     * `adaptiveThemes: true` can leave no theme selected on web when `prefers-color-scheme`
     * is still "unspecified", which breaks any `StyleSheet.create(theme => …)` at import time.
     * We pick an initial theme from RN `Appearance` and keep it in sync below.
     */
    initialTheme: resolveThemeName,
  },
});

if (typeof Appearance.addChangeListener === 'function') {
  Appearance.addChangeListener(({ colorScheme }) => {
    if (getFollowSystem()) {
      UnistylesRuntime.setTheme(colorScheme === 'dark' ? 'dark' : 'light');
    }
  });
}
