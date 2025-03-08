// src/types/issues.ts
export enum Priority {
  P0 = 'P0', // Critical - immediate action required
  P1 = 'P1', // High - resolve within 24 hours
  P2 = 'P2', // Medium - resolve within 3 days
  P3 = 'P3', // Low - resolve within 1 week
  P4 = 'P4', // Trivial - no specific timeline
}

export enum Severity {
  S0 = 'S0', // Critical - system down
  S1 = 'S1', // Major - significant impact
  S2 = 'S2', // Moderate - partial functionality affected
  S3 = 'S3', // Minor - edge case or cosmetic issue
}

export enum Status {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  FIXED = 'FIXED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
  DUPLICATE = 'DUPLICATE',
  WONT_FIX = 'WONT_FIX',
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  reproduceSteps: string;
  componentId: string;
  reporterId: string;
  assigneeId: string | null;
  priority: string;
  severity: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  labels: string[];
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  issueId: string;
  uploaderId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}