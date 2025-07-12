import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_BASE_URL;

export interface User {
  id: string;
  name: string;
  email: string;
  location?: string;
  profilePhoto?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: string[];
  isPublic: boolean;
  isAdmin: boolean;
  rating: number;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        const userData = response.data.user;
        // Convert MongoDB _id to id for frontend compatibility
        const user: User = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          location: userData.location,
          profilePhoto: userData.profilePhoto,
          skillsOffered: userData.skillsOffered,
          skillsWanted: userData.skillsWanted,
          availability: userData.availability,
          isPublic: userData.isPublic,
          isAdmin: userData.isAdmin,
          rating: userData.rating,
          bio: userData.bio,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        setUser(user);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Convert MongoDB _id to id for frontend compatibility
        const user: User = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          location: userData.location,
          profilePhoto: userData.profilePhoto,
          skillsOffered: userData.skillsOffered,
          skillsWanted: userData.skillsWanted,
          availability: userData.availability,
          isPublic: userData.isPublic,
          isAdmin: userData.isAdmin,
          rating: userData.rating,
          bio: userData.bio,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: Partial<User> & { email: string; password: string }): Promise<boolean> => {
    try {
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user: newUserData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Convert MongoDB _id to id for frontend compatibility
        const user: User = {
          id: newUserData._id,
          name: newUserData.name,
          email: newUserData.email,
          location: newUserData.location,
          profilePhoto: newUserData.profilePhoto,
          skillsOffered: newUserData.skillsOffered,
          skillsWanted: newUserData.skillsWanted,
          availability: newUserData.availability,
          isPublic: newUserData.isPublic,
          isAdmin: newUserData.isAdmin,
          rating: newUserData.rating,
          bio: newUserData.bio,
          createdAt: newUserData.createdAt,
          updatedAt: newUserData.updatedAt
        };
        
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await axios.put('/auth/me', updates);
      
      if (response.data.success) {
        const userData = response.data.user;
        
        // Convert MongoDB _id to id for frontend compatibility
        const updatedUser: User = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          location: userData.location,
          profilePhoto: userData.profilePhoto,
          skillsOffered: userData.skillsOffered,
          skillsWanted: userData.skillsWanted,
          availability: userData.availability,
          isPublic: userData.isPublic,
          isAdmin: userData.isAdmin,
          rating: userData.rating,
          bio: userData.bio,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}