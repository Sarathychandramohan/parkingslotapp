// contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme() || 'light';
  const [theme, setThemeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved) setThemeState(saved as ThemeMode);
    })();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    await AsyncStorage.setItem('app_theme', mode);
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light');
  };

  const colorScheme: ColorScheme =
    theme === 'auto' ? systemScheme : theme;

  const colors = Colors[colorScheme];

  return (
    <ThemeContext.Provider
      value={{ theme, colorScheme, colors, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
