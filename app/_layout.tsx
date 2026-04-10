import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initDatabase } from "@/lib/database";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { initializePurchases } from "@/lib/revenueCat";

SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const origOnError = window.onerror;
  window.onerror = (msg, source, lineno, colno, error) => {
    const msgStr = typeof msg === 'string' ? msg : '';
    if (msgStr.includes('xFileControl') || msgStr.includes('unable to open database') || msgStr.includes('bad parameter or other API misuse')) {
      return true;
    }
    if (origOnError) return origOnError(msg, source, lineno, colno, error);
    return false;
  };

  const origOnUnhandled = window.onunhandledrejection;
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (msg.includes('xFileControl') || msg.includes('unable to open database') || msg.includes('bad parameter or other API misuse')) {
      event.preventDefault();
      return;
    }
    if (origOnUnhandled) (origOnUnhandled as any).call(window, event);
  };
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: '#2a2d32' },
        headerTintColor: '#e8eaed',
        contentStyle: { backgroundColor: '#2a2d32' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="recipe/edit"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prep-sheet"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="recipe/cook-mode"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      Promise.all([
        initDatabase().catch((e) => {
          console.warn('Database init warning:', e?.message || e);
        }),
        useSubscriptionStore.getState().hydrate(),
        useSettingsStore.getState().hydrate(),
        initializePurchases().then(() => {
          useSubscriptionStore.getState().syncWithRevenueCat();
        }).catch((e) => {
          console.warn('RevenueCat init warning:', e?.message || e);
        }),
      ]).finally(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
