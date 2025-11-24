import { useUserState } from "@/store/userState";
import { useMutation } from "@tanstack/react-query";
import { Toast } from "toastify-react-native";
import { useSafeRouter } from "../navigation/router";

export const useLogout = () => {
  const { logOut } = useUserState();

  const { mutate, isPending } = useMutation({
    mutationFn: logOut,
    onError(error) {
      Toast.show({ type: "error", text1: error.message });
    },
    onSuccess(data) {
      console.log("data after logout", data);
      Toast.show({ type: "success", text1: "Logged out successfully!" });
    },
  });
  return { logOut: mutate, isLoggingOut: isPending };
};

export const useSignUpWithEmail = () => {
  const router = useSafeRouter();
  const { signUpWithEmail } = useUserState();
  const { mutate, isPending } = useMutation({
    mutationFn: signUpWithEmail,
    onError(error) {
      Toast.show({
        type: "error",
        text1: "Registration failed!",
        text2: error.message,
      });
    },
    onSuccess(data) {
      console.log("Signup response:", data);

      // Check if session exists (email confirmation not required)
      if (data.session) {
        Toast.show({
          type: "success",
          text1: "Account created successfully!",
          text2: "Let's customize your experience",
        });
        // Redirect new users to interests page to set preferences
        router.replace("/interests");
      } else if (data.user && !data.session) {
        // User created but needs email verification
        Toast.show({
          type: "warn",
          text1: "Please check your inbox for email verification!",
        });
        router.replace("/(auth)/login");
      } else {
        // Something went wrong
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: "Please try again",
        });
        router.replace("/(auth)/login");
      }
    },
  });
  return { signUpWithEmail: mutate, isSigningUpWithEmail: isPending };
};
export const useSignInWithEmail = () => {
  const router = useSafeRouter();
  const { signInWithEmail } = useUserState();
  const { mutate, isPending } = useMutation({
    mutationFn: signInWithEmail,
    onError(error) {
      Toast.show({
        type: "error",
        text1: "Login failed!",
        text2: error.message,
      });
    },
    onSuccess() {
      Toast.show({
        type: "success",
        text1: "Welcome back! 👋",
        text2: "You've successfully logged in.",
      });
      router.replace("/(tabs)");
    },
  });

  return { signInWithEmail: mutate, isSigningInWithEmail: isPending };
};
