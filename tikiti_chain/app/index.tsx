import { useSafeRouter } from "@/hooks/navigation/router";
import { useEffect } from "react";

export default function Index() {
  const router = useSafeRouter();

  useEffect(() => {
    // Redirect immediately to auth screen
    router.replace("/(auth)");
  }, []);

  return null;
}
