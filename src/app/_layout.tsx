import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '@/context/AppContext';
import { Crescent } from '@/components/BrandMark';
import { colors } from '@/theme/colors';

function RootStack() {
  const { booting, onboarded, user } = useApp();
  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <Crescent size={40} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !user}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category/[category]" />
        <Stack.Screen name="analysis/[source]" />
        <Stack.Screen name="combined" />
        <Stack.Screen name="share" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}
