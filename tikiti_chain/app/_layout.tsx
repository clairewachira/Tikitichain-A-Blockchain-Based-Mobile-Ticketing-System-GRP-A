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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="interests" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </BottomSheetModalProvider>

      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
