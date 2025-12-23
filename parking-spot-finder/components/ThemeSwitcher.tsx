import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/contexts/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'auto';

export default function ThemeSwitcher() {
  const { theme, setTheme, colors } = useTheme();

  const options: { label: string; value: ThemeMode; icon: any }[] = [
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
    { label: 'System Default', value: 'auto', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 12,
        }}
      >
        App Theme
      </Text>

      {options.map(option => {
        const selected = theme === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => setTheme(option.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              borderRadius: 10,
              marginBottom: 10,
              backgroundColor: selected
                ? colors.primary + '20'
                : colors.card,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <Ionicons
              name={option.icon}
              size={22}
              color={selected ? colors.primary : colors.textSecondary}
            />
            <Text
              style={{
                marginLeft: 14,
                fontSize: 15,
                color: colors.text,
                fontWeight: selected ? '600' : '400',
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
