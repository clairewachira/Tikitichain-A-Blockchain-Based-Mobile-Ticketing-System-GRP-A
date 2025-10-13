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
import Toast from "react-native-toast-message";
import toastConfig from "@/components/ui/Toast";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import AuthProvider from "@/providers/auth-provider";
import { AppState } from "react-native";
import { supabase } from "@/utils/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Tells Supabase Auth to continuously refresh the session automatically
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

function RootLayoutNav() {
  const queryClient = new QueryClient();
  const { isLoggedIn } = useAuthContext();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={!isLoggedIn}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="index" />
                <Stack.Screen name="interests" />
              </Stack.Protected>
              <Stack.Protected guard={isLoggedIn}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="events" />
              </Stack.Protected>
            </Stack>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
      <Toast config={toastConfig} swipeable autoHide />
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
