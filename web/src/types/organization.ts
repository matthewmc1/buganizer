// src/types/organization.ts
export interface Organization {
  id: string;
  name: string;
  domain: string; // Primary email domain for organization
  createdAt: string;
  updatedAt: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  defaultIssueTemplate?: string;
  allowPublicIssues: boolean;
  defaultAssigneePolicy: 'TEAM_LEAD' | 'ROUND_ROBIN' | 'MANUAL';
  supportSLA: {
    enabled: boolean;
    defaultResponseHours: number;
    defaultResolutionHours: number;
  };
}