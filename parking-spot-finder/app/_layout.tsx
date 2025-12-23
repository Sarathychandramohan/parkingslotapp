import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import HeaderThemeToggle from '~/components/HeaderThemeToggle';

function LayoutContent() {
  const { colorScheme, colors } = useTheme();

  return (
    <>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor="transparent"
      />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: () => <HeaderThemeToggle />,
        }}
      >
        {/* Landing / Splash */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Auth flow */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Driver tabs */}
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />

        {/* Admin tabs */}
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
