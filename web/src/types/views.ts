// src/types/views.ts
export interface SavedView {
    id: string;
    name: string;
    ownerId: string;
    isTeamView: boolean;
    teamId?: string;
    queryString: string;
    createdAt: string;
    updatedAt: string;
  }