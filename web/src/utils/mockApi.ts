// src/utils/mockApi.ts
import { Role } from '../types/permissions';
import { User } from '../types/users';
import { Organization } from '../types/organization';
import { UserRole } from '../types/permissions';

// Sample user data with proper types
const users: User[] = [
  { 
    id: 'user-1', 
    name: 'Admin User', 
    email: 'admin@buganizer.dev', 
    googleId: 'google123',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'user-2', 
    name: 'Developer User', 
    email: 'developer@buganizer.dev', 
    googleId: 'google456',
    avatarUrl: 'https://i.pravatar.cc/150?u=dev',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'user-3', 
    name: 'Manager User', 
    email: 'manager@buganizer.dev', 
    googleId: 'google789',
    avatarUrl: 'https://i.pravatar.cc/150?u=manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'user-4', 
    name: 'QA Tester', 
    email: 'tester@buganizer.dev', 
    googleId: 'google101',
    avatarUrl: 'https://i.pravatar.cc/150?u=tester',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Create a UserRole map linking users to their roles
const userRoles: Record<string, Role> = {
  'user-1': Role.ADMIN,
  'user-2': Role.DEVELOPER,
  'user-3': Role.MANAGER,
  'user-4': Role.DEVELOPER
};

// Mock organization with properly typed properties
const organization: Organization = {
  id: 'org-1',
  name: 'Demo Organization',
  domain: 'buganizer.dev',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: {
    allowPublicIssues: false,
    defaultAssigneePolicy: 'MANUAL', // This is now typed correctly
    supportSLA: {
      enabled: true,
      defaultResponseHours: 24,
      defaultResolutionHours: 72
    }
  }
};

export const mockAuth = {
  login: (email: string, password: string) => {
    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create properly typed roles for the user
    const roles: UserRole[] = [{
      id: `role-${user.id}`,
      userId: user.id,
      organizationId: organization.id,
      role: userRoles[user.id] || Role.VIEWER, // Use the mapped role
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      teamId: undefined
    }];
    
    return {
      token: `mock_token_${Date.now()}`,
      user,
      organization,
      roles
    };
  },
  
  getCurrentUser: () => {
    // Return admin user by default
    return users[0];
  },
  
  // Add other methods as needed
  googleLogin: (googleToken: string) => {
    // Create a google user with proper types
    const user: User = {
      id: 'user-google',
      name: 'Google User',
      email: 'google.user@gmail.com',
      googleId: googleToken,
      avatarUrl: 'https://i.pravatar.cc/150?u=google',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Create properly typed roles
    const roles: UserRole[] = [{
      id: 'role-google',
      userId: user.id,
      organizationId: organization.id,
      role: Role.DEVELOPER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    
    return {
      token: `google_token_${Date.now()}`,
      user,
      organization,
      roles
    };
  }
};