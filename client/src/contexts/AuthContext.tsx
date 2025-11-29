import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type User } from "firebase/auth";
import { onAuthChange, signOut as firebaseSignOut, handleRedirect } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Google Sign-In
    handleRedirect().then((result) => {
      if (result?.user) {
        createUserProfile(result.user);
      }
    }).catch((error) => {
      console.error("Redirect error:", error);
    });

    // Listen to auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await createUserProfile(firebaseUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createUserProfile = async (firebaseUser: User) => {
    try {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from("users_profile")
        .select("*")
        .eq("id", firebaseUser.uid)
        .single();

      if (!existingProfile) {
        // Create user profile in Supabase
        await supabase.from("users_profile").insert({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
        });
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
