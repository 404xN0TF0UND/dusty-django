import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import axios from 'axios';
import { User } from '../types';
import { subscribeUserToPush } from '../services/pushSubscriptionService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Django API
  const fetchUser = async () => {
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('http://localhost:8000/api/profiles/me/');
      const profile = response.data;
      setCurrentUser({
        ...profile,
        username: profile.user?.username,
        email: profile.user?.email,
      });
    } catch (error) {
      setCurrentUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
    // Optionally, set up interval to refresh token or user info
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    await AuthService.login(username, password);
    await fetchUser();
    // Subscribe to push notifications after login
    const token = AuthService.getAccessToken();
    if (token) {
      subscribeUserToPush(token);
    }
    setLoading(false);
  };

  const signOutUser = async () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signOutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 