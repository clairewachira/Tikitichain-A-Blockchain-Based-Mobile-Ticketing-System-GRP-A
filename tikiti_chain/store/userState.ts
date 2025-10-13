import {
  SignInData,
  SignInResponse,
  SignUpData,
  SignUpResponse,
} from "@/types/auth";
import { supabase } from "@/utils/supabase";
import Toast from "react-native-toast-message";
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
      options: { data: { username } },
    });
    if (error) Toast.show({ type: "error", text1: error.message });
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
