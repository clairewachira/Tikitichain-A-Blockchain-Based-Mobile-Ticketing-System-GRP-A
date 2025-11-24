import "fastestsmallesttextencoderdecoder";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  PassionOne_400Regular,
  PassionOne_700Bold,
  PassionOne_900Black,
  useFonts as usePassionOne,
} from "@expo-google-fonts/passion-one";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts as useInter,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import toastConfig from "@/components/ui/Toast";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import AuthProvider from "@/providers/auth-provider";
import WalletConnectProvider from "@/providers/wallet-connect-provider";
import { AppState } from "react-native";
import { supabase } from "@/utils/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";

// Tells Supabase Auth to continuously refresh the session automatically
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Create QueryClient once outside component to prevent recreating on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { isLoggedIn } = useAuthContext();

  return (
    <QueryClientProvider client={queryClient}>
      <WalletConnectProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }}>
                {/* Unprotected screens - accessible to everyone */}
                <Stack.Screen name="interests" />

                {/* Unauthenticated only screens */}
                <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="index" />
                </Stack.Protected>

                {/* Authenticated only screens */}
                <Stack.Protected guard={isLoggedIn}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="events" />
                  <Stack.Screen name="admin" />
                </Stack.Protected>
              </Stack>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
        <ToastManager config={toastConfig} />
      </WalletConnectProvider>
    </QueryClientProvider>
  );
}

export default function Layout() {
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  const [passionOneLoaded] = usePassionOne({
    PassionOne_400Regular,
    PassionOne_700Bold,
    PassionOne_900Black,
  });

  useEffect(() => {
    if (interLoaded || passionOneLoaded) {
      SplashScreen.hideAsync();
    }
  }, [interLoaded, passionOneLoaded]);

  if (!interLoaded || !passionOneLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
