// src/types/sla.ts
import { Priority, Severity } from './issues';

export interface SLATarget {
  issueId?: string;
  priority: string;
  severity: string;
  targetDate: string;
  description: string;
}

export interface SLARiskIssue {
  issueId: string;
  title: string;
  dueDate: string;
  hoursRemaining: number;
  priority: string;
  severity: string;
}

export interface SLAStats {
  totalIssues: number;
  metSla: number;
  missedSla: number;
  slaCompliancePercentage: number;
  issuesByPriority: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  complianceByPriority: Record<string, number>;
  complianceBySeverity: Record<string, number>;
}