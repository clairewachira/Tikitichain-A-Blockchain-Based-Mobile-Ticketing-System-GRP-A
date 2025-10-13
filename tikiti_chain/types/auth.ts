import { Session, User, WeakPassword } from "@supabase/supabase-js";

export type SignInData = {
  email: string;
  password: string;
};

export type SignInResponse = {
  user: User | null;
  session: Session | null;
  weak_password?: WeakPassword | null;
};

export type SignUpData = {
  email: string;
  password: string;
  username: string;
};

export type SignUpResponse = { user: User | null; session: Session | null };
