import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, signInWithPhone, verifyOtp as verifyOtpApi, signOut as signOutApi } from "@/lib/supabase-client";
import type { User as SupabaseUser, Session, AuthError } from "@supabase/supabase-js";

interface User {
  id: string;
  phone: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    phone: supabaseUser.phone || null,
    email: supabaseUser.email || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(mapSupabaseUser(session?.user || null));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(mapSupabaseUser(session?.user || null));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (phone: string): Promise<{ error: AuthError | null }> => {
    const { error } = await signInWithPhone(phone);
    return { error };
  };

  const verifyOtp = async (phone: string, token: string): Promise<{ error: AuthError | null }> => {
    const { error } = await verifyOtpApi(phone, token);
    return { error };
  };

  const logout = async () => {
    await signOutApi();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
