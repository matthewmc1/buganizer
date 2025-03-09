// src/hooks/useAuth.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types/users';
import { Organization } from '../types/organization';
import { PERMISSION_MATRIX, Role, UserRole } from '../types/permissions';
import api from '../utils/api';
import { mock } from 'node:test';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  organization: Organization | null;
  userRoles: UserRole[];
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    organization: null,
    userRoles: [],
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
      // Get user info
      const userResponse = await api.auth.getCurrentUser();
      const user = userResponse.data;
      
      // Get organization info
      const orgResponse = await api.organizations.getOrganization(user.organizationId);
      const organization = orgResponse.data;
      
      // Get user roles
      const rolesResponse = await api.users.getUserRoles(user.id, organization.id);
      const userRoles = rolesResponse.data;

      setAuthState({
        user,
        token: authState.token,
        organization,
        userRoles,
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
        organization: null,
        userRoles: [],
        isAuthenticated: false,
        loading: false,
        error: 'Authentication failed. Please log in again.',
      });
    }
  }, [authState.token]);

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
        const response = await api.auth.login(mockUser.email, "");
        const { token, user, organization, roles } = response.data;
        
        // Finally, update auth state - this should trigger redirects via useEffect in components
              // Update auth state
              setAuthState({
                user,
                token,
                organization,
                userRoles: roles,
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

  // Login with credentials
  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    console.log("useAuth: loginWithCredentials called", { email });
    
    setAuthState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));

    try {
      // Call login API
      const response = await api.auth.login(email, password);
      const { token, user, organization, roles } = response.data;
      
      // Store auth data
      localStorage.setItem('token', token);
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update auth state
      setAuthState({
        user,
        token,
        organization,
        userRoles: roles,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return user;
    } catch (err) {
      console.error("useAuth: Login error", err);
      
      // Clear auth data
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Update auth state with error
      setAuthState(prev => ({
        ...prev,
        user: null,
        token: null,
        organization: null,
        userRoles: [],
        isAuthenticated: false,
        loading: false,
        error: 'Login failed. Please try again.'
      }));
      
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset auth state
    setAuthState({
      user: null,
      token: null,
      organization: null,
      userRoles: [],
      isAuthenticated: false,
      loading: false,
      error: null,
    });
    
    // Optionally call logout API endpoint
    try {
      api.auth.logout();
    } catch (error) {
      console.error('Error logging out on server:', error);
    }
  }, []);

  // Check if user has permission for an action
  const hasPermission = useCallback((resource: string, action: string, teamId?: string) => {
    // If not authenticated, no permissions
    if (!authState.isAuthenticated || !authState.user || !authState.organization) {
      return false;
    }
    
    // Check for team-specific roles first (if teamId provided)
    if (teamId) {
      const teamRole = authState.userRoles.find(role => role.teamId === teamId);
      if (teamRole && PERMISSION_MATRIX[teamRole.role][resource]?.includes(action)) {
        return true;
      }
    }
    
    // Check for organization-wide roles
    const orgRoles = authState.userRoles.filter(role => !role.teamId);
    return orgRoles.some(role => 
      PERMISSION_MATRIX[role.role][resource]?.includes(action)
    );
  }, [authState.isAuthenticated, authState.user, authState.organization, authState.userRoles]);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user: authState.user,
    token: authState.token,
    organization: authState.organization,
    userRoles: authState.userRoles,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    loginWithGoogle,
    loginWithCredentials,
    logout,
    loadUser,
    hasPermission,
  };
};