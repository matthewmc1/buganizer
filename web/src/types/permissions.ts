// src/types/permissions.ts
export enum Role {
    ADMIN = 'ADMIN',           // Organization admin
    MANAGER = 'MANAGER',       // Team/project manager
    DEVELOPER = 'DEVELOPER',   // Regular team member
    VIEWER = 'VIEWER'          // Read-only access
  }
  
  export interface UserRole {
    id: string;
    userId: string;
    organizationId: string;
    role: Role;
    teamId?: string;  // Optional - for team-specific roles
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Permission {
    resource: string;  // "issue", "team", "assignment", etc.
    action: string;    // "create", "read", "update", "delete"
  }
  
  // Define what each role can do
  export const PERMISSION_MATRIX: Record<Role, Record<string, string[]>> = {
    [Role.ADMIN]: {
      issue: ['create', 'read', 'update', 'delete'],
      team: ['create', 'read', 'update', 'delete'],
      assignment: ['create', 'read', 'update', 'delete'],
      user: ['invite', 'read', 'update', 'remove'],
      organization: ['read', 'update'],
      settings: ['read', 'update'],
      report: ['read', 'create', 'share'],
    },
    [Role.MANAGER]: {
      issue: ['create', 'read', 'update', 'delete'],
      team: ['read', 'update'],
      assignment: ['create', 'read', 'update', 'delete'],
      user: ['invite', 'read'],
      organization: ['read'],
      settings: ['read'],
      report: ['read', 'create'],
    },
    [Role.DEVELOPER]: {
      issue: ['create', 'read', 'update'],
      team: ['read'],
      assignment: ['read', 'update'],
      user: ['read'],
      organization: ['read'],
      settings: ['read'],
      report: ['read'],
    },
    [Role.VIEWER]: {
      issue: ['read'],
      team: ['read'],
      assignment: ['read'],
      user: ['read'],
      organization: ['read'],
      report: ['read'],
    },
  };