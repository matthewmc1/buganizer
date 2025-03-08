// src/types/users.ts
export interface User {
    id: string;
    email: string;
    name: string;
    googleId: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Team {
    id: string;
    name: string;
    description: string;
    leadId: string;
    createdAt: string;
    updatedAt: string;
  }