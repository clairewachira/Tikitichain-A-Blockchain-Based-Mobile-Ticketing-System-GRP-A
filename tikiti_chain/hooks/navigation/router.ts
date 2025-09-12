import { useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import type { Href } from "expo-router";
import { NavigationOptions } from "expo-router/build/global-state/routing";

type SafeNavigateOptions = NavigationOptions;

export function useSafeRouter(delay = 500) {
  const router = useRouter();
  const pathname = usePathname();
  const isNavigating = useRef(false);

  const lock = () => {
    isNavigating.current = true;
    setTimeout(() => {
      isNavigating.current = false;
    }, delay);
  };

  const isSamePath = (path: Href) => pathname === path;

  const push = (targetPath: Href, options?: SafeNavigateOptions) => {
    if (isSamePath(targetPath) || isNavigating.current) return;
    lock();
    router.push(targetPath, options);
  };

  const replace = (targetPath: Href, options?: SafeNavigateOptions) => {
    if (isSamePath(targetPath) || isNavigating.current) return;
    lock();
    router.replace(targetPath, options);
  };

  const navigate = (targetPath: Href, options?: SafeNavigateOptions) => {
    if (isSamePath(targetPath) || isNavigating.current) return;
    lock();
    router.navigate(targetPath, options);
  };
  const prefetch = (targetPath: Href) => {
    router.prefetch(targetPath);
  };

  const back = () => {
    if (isNavigating.current) return;
    lock();
    router.back();
  };

  return {
    push,
    replace,
    prefetch,
    back,
    navigate,
  };
}
