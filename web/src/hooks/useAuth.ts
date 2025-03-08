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

      // First, update local storage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      
      // Finally, update auth state - this should trigger redirects via useEffect in components
      setAuthState({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      console.log('Login successful, auth state updated');
      return mockUser;
    }

    // Real implementation with API would go here
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

// Update to loginWithCredentials in useAuth.ts
const loginWithCredentials = useCallback(async (email: string, password: string) => {
  console.log("useAuth: loginWithCredentials called", { email });
  
  // Update loading state first
  setAuthState(prev => ({ 
    ...prev, 
    loading: true, 
    error: null 
  }));

  try {
    // Simulate API delay
    console.log("useAuth: Simulating API call...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For development, accept any email/password
    // In production, this would be a real API call
    
    // Generate mock user data
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

    console.log("useAuth: Login successful, storing token and user data");
    
    // Clear any previous auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Store new auth data
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Update axios headers for future API calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    
    console.log("useAuth: Updating auth state to authenticated");
    
    // Update auth state
    setAuthState({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
    
    console.log("useAuth: Auth state updated successfully");
    return mockUser;
  } catch (err) {
    console.error("useAuth: Login error", err);
    
    // Clear any partial auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    // Update auth state with error
    setAuthState(prev => ({
      ...prev,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: 'Login failed. Please try again.'
    }));
    
    throw err;
  }
}, []);

  // Improved Logout function
  const logout = useCallback(() => {
    // Clear all auth-related storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Additional session cleanup - clear any other auth-related items
    sessionStorage.clear(); // Clear any session storage data
    
    // Optionally clear cookies that might be auth-related
    // This is a simple approach; in a real app, you might want to be more selective
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Clear authorization header to prevent future authenticated requests
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset auth state
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
    
    // In a real app, you might also want to invalidate the token on the server
    // try {
    //   axios.post('/api/v1/auth/logout');
    // } catch (error) {
    //   console.error('Error logging out on server:', error);
    // }
    
    console.log('Logout successful, auth state reset');
    
    // Force refresh the page to ensure a clean state
    // This is a fallback approach to ensure all components react to the logout
    // window.location.href = '/login';
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