import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login, logout, AuthResponse, register } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isChild: boolean;
  isKids?: boolean;
}
interface AuthContextType {
  user: User | null;
  current_user_id: string;
  accessToken: string | null;
  isLoading: boolean;
  language: string;
  registerUser: (name: string, email: string, password: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => void;
  update_language: (lang: string) => void;
  isAuthenticated: boolean;
  selectedProfile: Profile | null;
  setSelectedProfile: (profile: Profile | null) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<string>('en');
  const [current_user_id, setCurrentUserId] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem('selectedProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse selectedProfile from localStorage:', e);
      return null;
    }
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('accessToken');
      const storedCurrentUserId = await AsyncStorage.getItem('current_user_id');
      const storedLanguage = await AsyncStorage.getItem('language');
      if (storedUser && storedToken && storedCurrentUserId) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        setCurrentUserId(storedCurrentUserId || '');
        if (storedLanguage) {
          setLanguage(storedLanguage as string);
        }
      }
      if (storedUser) {
        // Immediate check for admin email to improve responsiveness
        if (JSON.parse(storedUser).roles && JSON.parse(storedUser).roles.some(role => role.name === 'admin')) {
          setIsAdmin(true);
        }  
      } else {
        setIsAdmin(false);
        setSelectedProfile(null);
      }
      setIsLoading(false);

    };
    loadData();
  }, []);

  const loginUser = async (email: string, password: string) => {
    const data: AuthResponse = await login({ email, password });
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('current_user_id', `${data.user.id}`);
    await AsyncStorage.setItem('current_user', JSON.stringify(data.user));
    await AsyncStorage.setItem('accessToken', data.token);

    setUser(data.user);
    setIsAdmin(false);
    setSelectedProfile(null);
    setCurrentUserId(`${data.user.id}`);
    setAccessToken(data.token);
    if (data.user) {
        // Immediate check for admin email to improve responsiveness
      if (data.user.roles && data.user.roles.some(role => role.name === 'admin')) {
        setIsAdmin(true);
      } 
    }
    
  };
  const registerUser = async (name: string, email: string, password: string) => {
    const data: AuthResponse = await register({ name, email, password });
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('accessToken', data.token);
    setUser(data.user);
    setCurrentUserId(`${data.user.id}`);
    setAccessToken(data.token);
  };
  const logoutUser = async () => {
    await logout();
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('role');
    await AsyncStorage.removeItem('current_user_id');
    await AsyncStorage.removeItem('language');
    setUser(null);
    setAccessToken(null);
  };

  const update_language = (lang: string) => {
    AsyncStorage.setItem('language', lang);
    setLanguage(lang);
  };
  return (
    <AuthContext.Provider value={{ user, accessToken, loginUser, logoutUser, registerUser, update_language, isAuthenticated: !!accessToken, isLoading, current_user_id, language, selectedProfile, setSelectedProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
