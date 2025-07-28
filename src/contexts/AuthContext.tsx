import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  whatsapp?: string;
  role: 'admin' | 'staff' | 'customer';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, whatsapp: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setInitialLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setInitialLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    // Get user metadata
    const metadata = supabaseUser.user_metadata || {};
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: metadata.name || supabaseUser.email?.split('@')[0] || 'User',
      whatsapp: metadata.whatsapp,
      role: metadata.role || 'customer'
    };
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile from database to get complete info including role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        let currentUserData: User;

        if (profileError) {
          // If no profile exists, create one
          const newUser = mapSupabaseUser(data.user);
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: newUser.email,
              name: newUser.name,
              whatsapp: newUser.whatsapp,
              role: newUser.role
            });
          
          if (insertError) console.error('Error creating user profile:', insertError);
          currentUserData = newUser;
        } else {
          currentUserData = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            whatsapp: userProfile.whatsapp,
            role: userProfile.role
          };
        }

        // --- ADD THE FOLLOWING CODE BLOCK HERE ---
        // Update user_metadata in auth.users to sync with public.users
        const { error: updateMetadataError } = await supabase.auth.updateUser({
          data: {
            name: currentUserData.name,
            whatsapp: currentUserData.whatsapp,
            role: currentUserData.role
          }
        });

        if (updateMetadataError) {
          console.error('Error updating user metadata:', updateMetadataError);
        }
        // --- END OF CODE BLOCK TO ADD ---

        setUser(currentUserData); // Set the user state with the correct data
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, whatsapp: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            whatsapp: whatsapp,
            role: 'customer'
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile in database
        const newUser = {
          id: data.user.id,
          email: email,
          name: name,
          whatsapp: whatsapp,
          whatsapp: whatsapp,
          role: 'customer' as const
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert(newUser);
        
        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }

        setUser(newUser);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile from database to get complete info including role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        let currentUserData: User;

        if (profileError) {
          // If no profile exists, use auth data
          currentUserData = mapSupabaseUser(session.user);
        } else {
          currentUserData = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            whatsapp: userProfile.whatsapp,
            role: userProfile.role
          };
        }

        setUser(currentUserData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};
