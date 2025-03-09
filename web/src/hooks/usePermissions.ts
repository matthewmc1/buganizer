// src/hooks/usePermissions.ts
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { PERMISSION_MATRIX } from '../types/permissions';

export const usePermissions = () => {
  const { 
    isAuthenticated, 
    user, 
    organization, 
    userRoles,
    hasPermission: authHasPermission 
  } = useAuth();
  
  // Check if current user has permission for an action
  const hasPermission = useCallback((resource: string, action: string, teamId?: string) => {
    return authHasPermission(resource, action, teamId);
  }, [authHasPermission]);
  
  // Check if current user has any of the specified roles
  const hasRole = useCallback((roles: string[], teamId?: string) => {
    if (!isAuthenticated || !user || !organization) {
      return false;
    }
    
    const relevantRoles = teamId 
      ? userRoles.filter(role => role.teamId === teamId)
      : userRoles.filter(role => !role.teamId);
      
    return relevantRoles.some(role => roles.includes(role.role));
  }, [isAuthenticated, user, organization, userRoles]);
  
  // Get highest role for current user (in team or org-wide)
  const getHighestRole = useCallback((teamId?: string) => {
    if (!isAuthenticated || userRoles.length === 0) {
      return null;
    }
    
    const relevantRoles = teamId
      ? userRoles.filter(role => role.teamId === teamId)
      : userRoles.filter(role => !role.teamId);
    
    const roleHierarchy = ['VIEWER', 'DEVELOPER', 'MANAGER', 'ADMIN'];
    
    // Sort roles by hierarchy and return the highest
    const sortedRoles = [...relevantRoles].sort((a, b) => {
      return roleHierarchy.indexOf(b.role) - roleHierarchy.indexOf(a.role);
    });
    
    return sortedRoles.length > 0 ? sortedRoles[0].role : null;
  }, [isAuthenticated, userRoles]);
  
  return { 
    hasPermission,
    hasRole,
    getHighestRole,
    userRoles 
  };
};