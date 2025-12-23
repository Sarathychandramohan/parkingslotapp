import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/contexts/ThemeContext';

export default function HeaderThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme();

  const iconName =
    theme === 'light'
      ? 'sunny-outline'
      : theme === 'dark'
      ? 'moon-outline'
      : 'phone-portrait-outline';

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{ paddingHorizontal: 12 }}
      accessibilityLabel="Toggle theme"
    >
      <Ionicons
        name={iconName}
        size={22}
        color={colors.text}
      />
    </TouchableOpacity>
  );
}
