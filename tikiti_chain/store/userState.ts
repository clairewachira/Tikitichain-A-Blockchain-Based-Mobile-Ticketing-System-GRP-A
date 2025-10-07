import { create } from "zustand";

interface UserState {}

export const useUserState = create<UserState>((set, get) => ({}));
