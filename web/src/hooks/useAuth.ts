// src/hooks/useAuth.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types/users';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Initialize axios with the token
  useEffect(() => {
    if (authState.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authState.token]);

  // Load user from token
  const loadUser = useCallback(async () => {
    if (!authState.token) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      // For development, check if we have a locally stored user
      const storedUser = localStorage.getItem('user');
      if (storedUser && authState.token.startsWith('dev_token')) {
        // Using local development login
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: authState.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return;
      }

      // For production, would call API
      // const response = await axios.get('/api/v1/auth/user');
      // setAuthState({
      //   user: response.data,
      //   token: authState.token,
      //   isAuthenticated: true,
      //   loading: false,
      //   error: null,
      // });
      
      // For demo, simulate successful API response
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        googleId: '123',
        avatarUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAuthState({
        user: mockUser,
        token: authState.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: 'Authentication failed. Please log in again.',
      });
    }
  }, [authState.token]);

  // Login with Google
  const loginWithGoogle = useCallback(async (googleToken: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // In a real implementation, this would call your API
      // For demo purposes, we'll simulate a successful login
      if (googleToken === 'fake_google_token') {
        // Simulate API response
        const mockToken = 'mock_jwt_token';
        const mockUser: User = {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          googleId: '123',
          avatarUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        setAuthState({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        
        return mockUser;
      }

      // Real implementation with API
      /*
      const response = await axios.post('/api/v1/auth/google', { google_token: googleToken });
      
      localStorage.setItem('token', response.data.token);
      
      setAuthState({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return response.data.user;
      */

      throw new Error('Invalid token');
      
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Login failed. Please try again.',
      }));
      throw err;
    }
  }, []);

  // Login with local credentials (for development)
  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For development, accept any email/password
      // In production, you would call your real authentication API
      
      // Generate mock user from email
      const mockToken = 'dev_token_123';
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email,
        googleId: 'dev123',
        avatarUrl: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setAuthState({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return mockUser;
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Login failed. Please try again.',
      }));
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    loginWithGoogle,
    loginWithCredentials,
    logout,
    loadUser,
  };
};