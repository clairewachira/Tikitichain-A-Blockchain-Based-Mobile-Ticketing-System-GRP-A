import {
  SignInData,
  SignInResponse,
  SignUpData,
  SignUpResponse,
} from "@/types/auth";
import { supabase } from "@/utils/supabase";
import { Toast } from "toastify-react-native";
import { create } from "zustand";

interface UserState {
  signUpWithEmail: (data: SignUpData) => Promise<SignUpResponse>;
  signInWithEmail: (data: SignInData) => Promise<SignInResponse>;
  logOut: () => Promise<void>;
}

export const useUserState = create<UserState>((set, get) => ({
  async signUpWithEmail({ email, password, username }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: username } },
    });

    if (error) {
      Toast.show({ type: "error", text1: error.message });
      throw error;
    }

    // Manually insert profile if user was created successfully
    // This ensures profile is created even if the database trigger doesn't work
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: username,
          role: "attendee",
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't throw error here as the user is already created
        // The profile might already exist from the trigger
        if (!profileError.message.includes("duplicate key")) {
          Toast.show({
            type: "warn",
            text1: "Account created but profile setup incomplete",
          });
        }
      }
    }

    return data;
  },

  async signInWithEmail({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  },
}));
