import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  useFonts as usePlexFonts,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';

import { colors, type } from '@/constants/theme';
import { SessionProvider } from '@/lib/session';
import { CartProvider } from '@/lib/cart';
import { completeAuthSession } from '@/lib/auth';
import { configurationError } from '@/lib/supabase';

void SplashScreen.preventAutoHideAsync();
completeAuthSession();

export default function RootLayout() {
  const [displayLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
  });
  const [bodyLoaded] = usePlexFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });
  const fontsLoaded = displayLoaded && bodyLoaded;

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  const onLayout = useCallback(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={styles.splash} onLayout={onLayout} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {configurationError ? (
        <View style={styles.configError}>
          <Text style={styles.configTitle}>Bench Supply needs configuring</Text>
          <Text style={styles.configBody}>{configurationError}</Text>
        </View>
      ) : (
        <SessionProvider>
          <CartProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.paper },
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product/[slug]" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="login" />
            </Stack>
          </CartProvider>
        </SessionProvider>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  configError: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  configTitle: {
    ...type.sectionTitle,
  },
  configBody: {
    ...type.bodyMuted,
  },
});