"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { UserProfile, UserRole } from "@spiritual-os/types";
import { createClient } from "../supabase/client";

interface OpenAuthModalOptions {
  message?: string;
  redirectOnSuccess?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMessage: string;
  isSandboxMode: boolean;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  sendPhoneOtp: (
    phone: string
  ) => Promise<{ success: boolean; message?: string; isSandbox?: boolean }>;
  verifyPhoneOtp: (
    phone: string,
    token: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = "ishti_devotee_session_v1";

function isSupabaseLiveConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  if (anonKey.startsWith("awaiting_") || anonKey.includes("placeholder")) return false;
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMessage, setAuthModalMessage] = useState<string>("");
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  const isSandbox = !isSupabaseLiveConfigured();

  // Load existing session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        if (isSupabaseLiveConfigured()) {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user && isMounted) {
            const authUser = data.session.user;
            // Fetch profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("auth_user_id", authUser.id)
              .maybeSingle();

            if (profile && isMounted) {
              setUser(profile as UserProfile);
            } else if (isMounted) {
              // Profile not yet created or loading
              setUser({
                id: authUser.id,
                auth_user_id: authUser.id,
                phone: authUser.phone,
                full_name: authUser.user_metadata?.full_name || "Vedic Devotee",
                role: (authUser.user_metadata?.role as UserRole) || "devotee",
                language_preference: "en",
                is_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        } else {
          // Staging Sandbox / Mock Session Recovery
          if (typeof window !== "undefined") {
            const cached = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
            if (cached && isMounted) {
              try {
                setUser(JSON.parse(cached));
              } catch {
                localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[ISHTI Auth] Session initialization fallback:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    setAuthModalMessage(
      options?.message || "Sign in with your mobile number to access personalized features."
    );
    setRedirectAfterAuth(options?.redirectOnSuccess || null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalMessage("");
  }, []);

  const sendPhoneOtp = useCallback(
    async (phone: string): Promise<{ success: boolean; message?: string; isSandbox?: boolean }> => {
      const sanitizedPhone = phone.trim().replace(/[^\d+]/g, "");

      if (!sanitizedPhone.startsWith("+91") || sanitizedPhone.length !== 13) {
        return {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number (+91).",
        };
      }

      if (isSupabaseLiveConfigured()) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithOtp({
            phone: sanitizedPhone,
          });
          if (error) {
            return { success: false, message: error.message };
          }
          return { success: true, isSandbox: false };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to dispatch SMS OTP.";
          return { success: false, message: msg };
        }
      } else {
        // Sandbox fallback mode
        return {
          success: true,
          isSandbox: true,
          message: "Staging sandbox mode active. Use verification code: 123456",
        };
      }
    },
    []
  );

  const verifyPhoneOtp = useCallback(
    async (phone: string, token: string): Promise<{ success: boolean; error?: string }> => {
      const sanitizedPhone = phone.trim().replace(/[^\d+]/g, "");
      const sanitizedToken = token.trim();

      if (sanitizedToken.length !== 6) {
        return { success: false, error: "Verification code must be 6 digits." };
      }

      if (isSupabaseLiveConfigured()) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.verifyOtp({
            phone: sanitizedPhone,
            token: sanitizedToken,
            type: "sms",
          });
          if (error || !data.user) {
            return { success: false, error: error?.message || "Invalid OTP code." };
          }

          // Fetch or construct profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("auth_user_id", data.user.id)
            .maybeSingle();

          const activeUser: UserProfile = (profile as UserProfile) || {
            id: data.user.id,
            auth_user_id: data.user.id,
            phone: sanitizedPhone,
            full_name: "Vedic Devotee",
            role: "devotee",
            language_preference: "en",
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setUser(activeUser);
          closeAuthModal();

          if (redirectAfterAuth && typeof window !== "undefined") {
            window.location.href = redirectAfterAuth;
          }
          return { success: true };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Verification error.";
          return { success: false, error: msg };
        }
      } else {
        // Staging Sandbox verification: Accept '123456' or any 6 digits for testing
        if (sanitizedToken !== "123456" && sanitizedToken.length !== 6) {
          return { success: false, error: "Invalid OTP code. In staging sandbox, use 123456." };
        }

        const mockDevotee: UserProfile = {
          id: "devotee-sandbox-" + sanitizedPhone.slice(-4),
          auth_user_id: "auth-sandbox-" + sanitizedPhone.slice(-4),
          phone: sanitizedPhone,
          full_name: "Sadhaka Devotee",
          role: "devotee",
          language_preference: "en",
          sampradaya_tradition: "Advaita Vedanta",
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setUser(mockDevotee);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockDevotee));
        }

        closeAuthModal();

        if (redirectAfterAuth && typeof window !== "undefined") {
          window.location.href = redirectAfterAuth;
        }

        return { success: true };
      }
    },
    [closeAuthModal, redirectAfterAuth]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseLiveConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("[ISHTI Auth] Sign out error:", err);
      }
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<boolean> => {
      if (!user) return false;

      const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
      setUser(updated);

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updated));
      }

      if (isSupabaseLiveConfigured()) {
        try {
          const supabase = createClient();
          await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);
        } catch (err) {
          console.warn("[ISHTI Auth] Error syncing profile update to database:", err);
        }
      }

      return true;
    },
    [user]
  );

  const role = user?.role || null;

  const value = useMemo(
    () => ({
      user,
      role,
      isLoading,
      isAuthModalOpen,
      authModalMessage,
      isSandboxMode: isSandbox,
      openAuthModal,
      closeAuthModal,
      sendPhoneOtp,
      verifyPhoneOtp,
      signOut,
      updateProfile,
    }),
    [
      user,
      role,
      isLoading,
      isAuthModalOpen,
      authModalMessage,
      isSandbox,
      openAuthModal,
      closeAuthModal,
      sendPhoneOtp,
      verifyPhoneOtp,
      signOut,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
