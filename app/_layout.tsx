import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { initDatabase } from "@/lib/database";

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
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        contentStyle: { backgroundColor: '#0F172A' },
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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      initDatabase()
        .catch((e) => {
          console.warn('Database init warning:', e?.message || e);
        })
        .finally(() => {
          SplashScreen.hideAsync();
        });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
