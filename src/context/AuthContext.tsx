import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults - ensure we get the environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  uploadProfilePhoto: (file: File) => Promise<string>;
  deleteProfilePhoto: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
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
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
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
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user: newUserData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
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
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await api.put('/auth/me', updates);
      
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

  const uploadProfilePhoto = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const userData = response.data.user;
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
        return response.data.profilePhoto;
      }
      
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Upload profile photo error:', error);
      throw error;
    }
  };

  const deleteProfilePhoto = async (): Promise<void> => {
    try {
      const response = await api.delete('/auth/delete-photo');
      
      if (response.data.success) {
        const userData = response.data.user;
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
      console.error('Delete profile photo error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, uploadProfilePhoto, deleteProfilePhoto }}>
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