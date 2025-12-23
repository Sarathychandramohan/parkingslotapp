import { useTheme } from '~/contexts/ThemeContext';
import Colors from '~/constants/Colors';

export function useThemeColors() {
  const { colorScheme } = useTheme();
  return Colors[colorScheme ?? 'light'];
}