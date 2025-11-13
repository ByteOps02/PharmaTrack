import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiUrl } from '@/lib/api';
const API_BASE_URL = apiUrl('/api/auth'); // Base URL for your backend auth API

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  signup: (userData: { fullName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: { fullName?: string; email?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load user and token from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData.message);
        return false;
      }

      const data = await response.json();
      const loggedInUser: User = { id: data.user.id, email: data.user.email, fullName: data.user.fullName };
      setUser(loggedInUser);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('token', data.token);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login API call failed:', error);
      return false;
    }
  };

  const signup = async (userData: { fullName: string; email: string; password: string }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Signup failed:', errorData.message);
        return false;
      }

      const data = await response.json();
      const newUser: User = { id: data.user.id, email: data.user.email, fullName: data.user.fullName };
      setUser(newUser);
      setToken(data.token); // Backend currently returns token on signup
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', data.token);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Signup API call failed:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('User logged out');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const updateUser = async (userData: { fullName?: string; email?: string }): Promise<boolean> => {
    if (!user || !token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update user failed:', errorData.message);
        return false;
      }

      const data = await response.json();
      const updatedUser: User = { id: data.user.id, email: data.user.email, fullName: data.user.fullName };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Update user API call failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
