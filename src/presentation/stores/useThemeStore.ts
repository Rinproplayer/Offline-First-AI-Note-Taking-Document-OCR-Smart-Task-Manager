import { create } from 'zustand';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';
import { mmkvStorage } from '../../data/cache/mmkvStorage';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'mindvault_theme_mode';

const initialMode: ThemeMode = (mmkvStorage.getString(THEME_STORAGE_KEY) as ThemeMode) || 'dark';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: initialMode,
  colors: initialMode === 'dark' ? darkColors : lightColors,
  toggleTheme: () =>
    set((state) => {
      const nextMode: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
      mmkvStorage.setString(THEME_STORAGE_KEY, nextMode);
      return {
        mode: nextMode,
        colors: nextMode === 'dark' ? darkColors : lightColors
      };
    }),
  setTheme: (mode: ThemeMode) => {
    mmkvStorage.setString(THEME_STORAGE_KEY, mode);
    set({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors
    });
  }
}));

export function useTheme() {
  const { mode, colors, toggleTheme, setTheme } = useThemeStore();
  return {
    theme: mode,
    isDark: mode === 'dark',
    colors,
    toggleTheme,
    setTheme
  };
}
