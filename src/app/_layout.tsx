import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppStateProvider, useAppState } from '@/state/store';
import { colors } from '@/theme/tokens';

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  return (
    <AppStateProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </ThemeProvider>
    </AppStateProvider>
  );
}

function RootNavigator() {
  const { profile } = useAppState();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Protected guard={profile.onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ title: '' }} />
        <Stack.Screen name="thesis/[id]" options={{ title: '' }} />
        <Stack.Screen name="bet/[id]" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="takes" options={{ title: '' }} />
        <Stack.Screen name="calls" options={{ title: '' }} />
      </Stack.Protected>
      <Stack.Protected guard={!profile.onboarded}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
