import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
  is_premium?: boolean;
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
        .select("id,email,full_name,role,is_premium")
        .eq("id", authUser.id)
        .maybeSingle();
      console.dir(error);

      if (error) {
        console.log(JSON.stringify(error, null, 2));
      }

      console.log("PROFILE DATA:", profile);
      console.log("PROFILE ERROR:", error);

      // Preserve existing role if profile query fails
      const savedRole =
        (localStorage.getItem("user_role") as
          | "user"
          | "admin"
          | "super_admin"
          | null) || "user";

      const role =
        profile?.role ||
        savedRole;

      const finalUser: User = {
        id: profile?.id || authUser.id,
        name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User",

        email: profile?.email || authUser.email || "",

        role: role,

        avatar_url: authUser.user_metadata?.avatar_url || undefined,
        phone: undefined,
        is_premium: !!profile?.is_premium,
      };

      console.log(
        "[AuthContext] Final User loaded:",
        finalUser.email,
        finalUser.role
      );

      setUser(finalUser);
      console.log("PROFILE:", profile);
      console.log("PROFILE ROLE:", profile?.role);
      console.log("SAVED ROLE:", savedRole);
      console.log("FINAL USER:", finalUser);
      console.log("FINAL ROLE:", finalUser.role);

      localStorage.setItem(
        "user",
        JSON.stringify(finalUser)
      );

      localStorage.setItem(
        "user_role",
        finalUser.role
      );
    } catch (e) {
      console.error(
        "[AuthContext] Error fetching user data:",
        e
      );

      // Fallback user object
      const fallbackUser: User = {
        id: authUser.id,
        name:
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User",

        email: authUser.email || "",

        role:
          (localStorage.getItem("user_role") as
            | "user"
            | "admin"
            | "super_admin"
            | null) || "user",

        avatar_url:
          authUser.user_metadata?.avatar_url ||
          undefined,

        is_premium: false,
      };

      setUser(fallbackUser);

      localStorage.setItem(
        "user",
        JSON.stringify(fallbackUser)
      );
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

    try {
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
      }
    } catch (e) {
      console.error("Error updating user in Supabase", e);
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (user) {
      console.log("CURRENT ROLE:", user.role);
      console.log("IS ADMIN:", isAdmin);
    }
  }, [user, isAdmin]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading, isAdmin }}>
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
