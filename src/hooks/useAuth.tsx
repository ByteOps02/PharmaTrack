import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  authError: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, options?: { data?: object; emailRedirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    authLoading,
    authError,
    signIn: async (email, password) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } catch (error: unknown) {
        setAuthError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    signUp: async (email, password, options) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.signUp({ email, password, options });
        if (error) throw error;
      } catch (error: unknown) {
        setAuthError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    signOut: async () => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error: unknown) {
        setAuthError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
