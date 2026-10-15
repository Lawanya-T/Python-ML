// src/lib/auth/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthUser, FarmerProfile, LoginInput, RegisterInput } from "@/types";

interface SavedProfile {
  profile: FarmerProfile;
  needsCompletion: boolean;
}

const PROFILES_STORAGE_KEY = "farmer_profiles";

function readSavedProfile(user: AuthUser): SavedProfile | null {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || "{}") as Record<string, SavedProfile>;
    if (profiles[user.id]) return profiles[user.id];
  } catch {
    // Continue to check the legacy profile below.
  }

  try {
    const legacyProfile = localStorage.getItem("farmer_profile");
    if (!legacyProfile) return null;
    const parsed = JSON.parse(legacyProfile) as FarmerProfile;
    if (parsed.phone !== user.phone) return null;

    const migratedProfile: SavedProfile = {
      profile: { ...parsed, name: user.name, phone: user.phone, email: user.email ?? parsed.email ?? "" },
      needsCompletion: false,
    };
    writeSavedProfile(user.id, migratedProfile);
    return migratedProfile;
  } catch {
    return null;
  }
}

function writeSavedProfile(userId: string, savedProfile: SavedProfile) {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || "{}") as Record<string, SavedProfile>;
    profiles[userId] = savedProfile;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify({ [userId]: savedProfile }));
  }
}

function createProfile(user: AuthUser, initialProfile?: Partial<FarmerProfile>): FarmerProfile {
  return {
    name: user.name,
    phone: user.phone,
    email: user.email ?? "",
    village: initialProfile?.village ?? "",
    land_size_acres: initialProfile?.land_size_acres ?? 0,
    farming_experience_years: initialProfile?.farming_experience_years ?? 0,
    preferred_crops: initialProfile?.preferred_crops ?? [],
    preferred_language: initialProfile?.preferred_language ?? "en",
    notifications_enabled: initialProfile?.notifications_enabled ?? true,
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: FarmerProfile | null;
  profileNeedsCompletion: boolean;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput, profile?: Partial<FarmerProfile>) => Promise<void>;
  updateProfile: (profile: FarmerProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("auth_user");
        if (saved) {
          const savedUser = JSON.parse(saved) as AuthUser;
          const savedProfile = readSavedProfile(savedUser);
          setUser(savedUser);
          setProfile(savedProfile?.profile ?? createProfile(savedUser));
          setProfileNeedsCompletion(savedProfile?.needsCompletion ?? false);
        }
      } catch {
        localStorage.removeItem("auth_user");
      }
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const login = async (data: LoginInput) => {
    const { user: loggedInUser, token } = await api.login(data);
    const savedProfile = readSavedProfile(loggedInUser);
    const profileForUser = savedProfile?.profile ?? createProfile(loggedInUser);
    const userWithProfile = { ...loggedInUser, name: profileForUser.name, email: profileForUser.email || loggedInUser.email };
    localStorage.setItem("auth_user", JSON.stringify(userWithProfile));
    localStorage.setItem("auth_token", token);
    setUser(userWithProfile);
    setProfile(profileForUser);
    setProfileNeedsCompletion(savedProfile?.needsCompletion ?? false);
    router.push("/");
  };

  const register = async (data: RegisterInput, initialProfile?: Partial<FarmerProfile>) => {
    const { user: newUser, token } = await api.register(data);
    const profileForUser = createProfile(newUser, initialProfile);
    writeSavedProfile(newUser.id, { profile: profileForUser, needsCompletion: true });
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    localStorage.setItem("auth_token", token);
    setUser(newUser);
    setProfile(profileForUser);
    setProfileNeedsCompletion(true);
    router.push("/profile");
  };

  const updateProfile = (updatedProfile: FarmerProfile) => {
    if (!user) return;
    const savedProfile = { profile: updatedProfile, needsCompletion: false };
    const updatedUser = { ...user, name: updatedProfile.name, email: updatedProfile.email || undefined };
    writeSavedProfile(user.id, savedProfile);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setProfile(updatedProfile);
    setProfileNeedsCompletion(false);
  };

  const logout = () => {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    setUser(null);
    setProfile(null);
    setProfileNeedsCompletion(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, profileNeedsCompletion, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}