import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User } from './AuthContext';

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_BASE_URL;


export interface SwapRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  skillOffered: string;
  skillWanted: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  rating?: number;
  feedback?: string;
}

interface DataContextType {
  users: User[];
  swapRequests: SwapRequest[];
  loading: boolean;
  createSwapRequest: (request: Omit<SwapRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateSwapRequest: (id: string, updates: Partial<SwapRequest>) => void;
  deleteSwapRequest: (id: string) => void;
  searchUsers: (skill?: string) => User[];
  refreshUsers: () => void;
  refreshSwapRequests: () => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchSwapRequests();
  }, []);

  const convertUserData = (userData: any): User => ({
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
  });

  const convertSwapData = (swapData: any): SwapRequest => ({
    id: swapData._id,
    requesterId: swapData.requester._id || swapData.requester,
    receiverId: swapData.receiver._id || swapData.receiver,
    skillOffered: swapData.skillOffered,
    skillWanted: swapData.skillWanted,
    message: swapData.message,
    status: swapData.status,
    createdAt: swapData.createdAt,
    rating: swapData.rating,
    feedback: swapData.feedback
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      if (response.data.success) {
        const usersData = response.data.data.users.map(convertUserData);
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSwapRequests = async () => {
    try {
      const response = await axios.get('/swaps');
      if (response.data.success) {
        const swapsData = response.data.data.swapRequests.map(convertSwapData);
        setSwapRequests(swapsData);
      }
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
  };

  const refreshSwapRequests = () => {
    fetchSwapRequests();
  };

  const createSwapRequest = async (request: Omit<SwapRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      const requestData = {
        receiverId: request.receiverId,
        skillOffered: request.skillOffered,
        skillWanted: request.skillWanted,
        message: request.message
      };

      const response = await axios.post('/swaps', requestData);
      if (response.data.success) {
        // Refresh swap requests to get the latest data
        fetchSwapRequests();
      }
    } catch (error) {
      console.error('Error creating swap request:', error);
      throw error;
    }
  };

  const updateSwapRequest = async (id: string, updates: Partial<SwapRequest>) => {
    try {
      let endpoint = '';
      let data = {};

      if (updates.status === 'accepted') {
        endpoint = `/swaps/${id}/accept`;
      } else if (updates.status === 'rejected') {
        endpoint = `/swaps/${id}/reject`;
      } else if (updates.status === 'completed') {
        endpoint = `/swaps/${id}/complete`;
        data = {
          rating: updates.rating,
          feedback: updates.feedback
        };
      }

      const response = await axios.put(endpoint, data);
      if (response.data.success) {
        // Refresh swap requests to get the latest data
        fetchSwapRequests();
      }
    } catch (error) {
      console.error('Error updating swap request:', error);
      throw error;
    }
  };

  const deleteSwapRequest = async (id: string) => {
    try {
      const response = await axios.delete(`/swaps/${id}`);
      if (response.data.success) {
        // Refresh swap requests to get the latest data
        fetchSwapRequests();
      }
    } catch (error) {
      console.error('Error deleting swap request:', error);
      throw error;
    }
  };

  const searchUsers = (skill?: string) => {
    if (!skill) return users.filter(user => user.isPublic);
    
    return users.filter(user => 
      user.isPublic && (
        user.skillsOffered.some(s => s.toLowerCase().includes(skill.toLowerCase())) ||
        user.skillsWanted.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      )
    );
  };

  const banUser = async (userId: string) => {
    try {
      const response = await axios.put(`/admin/users/${userId}/ban`);
      if (response.data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const response = await axios.put(`/admin/users/${userId}/unban`);
      if (response.data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      users,
      swapRequests,
      loading,
      createSwapRequest,
      updateSwapRequest,
      deleteSwapRequest,
      searchUsers,
      refreshUsers,
      refreshSwapRequests,
      banUser,
      unbanUser,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}