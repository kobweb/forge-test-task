import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import { useUniwind } from 'uniwind';

/** React Navigation's theme (headers, tab bar, screen backgrounds) built from HeroUI tokens. */
export function useNavigationTheme(): Theme {
  const { theme } = useUniwind();
  const [background, foreground, separator, accent, danger] = useThemeColor([
    'background',
    'foreground',
    'separator',
    'accent',
    'danger',
  ] as const);
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent,
      background,
      card: background,
      text: foreground,
      border: separator,
      notification: danger,
    },
  };
}
