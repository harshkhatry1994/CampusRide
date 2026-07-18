import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { isAdminRole, getRedirectPath } from "@/lib/roles";

interface IdentityVerification {
  verificationStatus: "not_submitted" | "pending" | "verified" | "rejected";
  institutionName?: string;
  studentIdNumber?: string;
  companyName?: string;
  employeeIdNumber?: string;
  idDocumentUrl?: string;
  adminNote?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  avatar?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  student_id?: string;
  gender?: string;
  address?: string;
  is_premium?: boolean;
  is_active?: boolean;
  loyalty_points?: number;
  identityVerification?: IdentityVerification;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  isAdmin: boolean;
  profileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem("token");
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Initializing...");

    // Initial load: check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthContext] getSession result:", !!session);
      if (session) {
        setToken(session.access_token);
        fetchUserData(session.user);
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_role");
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AuthContext] onAuthStateChange:", event, !!session);

        if (session) {
          setToken(session.access_token);
          // Only fetch user data on actual sign-in events, not on every token refresh
          // to avoid race conditions
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            fetchUserData(session.user);
          }
        } else if (event === "SIGNED_OUT") {
          console.log("[AuthContext] User signed out, clearing state");
          setUser(null);
          setToken(null);
          localStorage.removeItem("user");
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authUser: any) => {
    console.log("[AuthContext] Fetching user data for:", authUser.email);

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Critical Database Error loading profile:", error);
        toast.error("Failed to load your profile details from the database.");
        throw error;
      }

      const role = profile?.role;

      const finalUser: User = {
        id: profile?.id || authUser.id,
        name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User",
        email: profile?.email || authUser.email || "",
        role: role,
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || undefined,
        phone: profile?.phone || undefined,
        department: profile?.department || undefined,
        student_id: profile?.student_id || undefined,
        gender: profile?.gender || undefined,
        address: profile?.address || undefined,
        is_premium: !!profile?.is_premium,
        is_active: profile?.is_active !== false,
        loyalty_points: profile?.loyalty_points || 0,
      };

      console.log("[AuthContext] Final User loaded:", finalUser.email, finalUser.role);

      setUser(finalUser);
      localStorage.setItem("user", JSON.stringify(finalUser));
      localStorage.setItem("user_role", finalUser.role);

      // Update last_login
      if (profile?.id) {
        supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', profile.id).then(() => {});
      }
    } catch (e) {
      console.error("[AuthContext] Error fetching user data, halting login flow:", e);
      // Remove the silent fallback that forces the user role.
      // By not setting the user object, we prevent the incorrect redirect.
      toast.error("Unable to verify user role. Contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("user_role", userData.role);
    toast.success(`Welcome back, ${userData.name}!`);
  };

  const logout = async () => {
    console.log("[AuthContext] Logging out...");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Supabase signout error", e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    toast.success("Logged out successfully");
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("user_role", updatedUser.role);

    // Map updates to profile fields
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.student_id !== undefined) dbUpdates.student_id = updates.student_id;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.address !== undefined) dbUpdates.address = updates.address;

    try {
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
      }
    } catch (e) {
      console.error("Error updating user in Supabase", e);
    }
  };

  // ── Single source of truth: delegate to roles helper ──
  const isAdmin = isAdminRole(user?.role);
  const profileComplete = isAdmin
    ? true
    : !!(user?.name && user?.phone);

  useEffect(() => {
    if (user) {
      console.log("[Auth] Email:", user.email);
    }
  }, [user, isAdmin, profileComplete]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading, isAdmin, profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
