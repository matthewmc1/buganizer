export enum AssignmentStatus {
  PLANNING = 'PLANNING',      // Initial stage of planning the assignment
  IN_PROGRESS = 'IN_PROGRESS', // Currently being worked on
  TESTING = 'TESTING',         // In the testing phase
  COMPLETED = 'COMPLETED',     // Successfully finished
  CANCELLED = 'CANCELLED',     // Abandoned or terminated
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  priority: string;  // Match the existing Priority type pattern from issues
  teamId: string;
  leadId: string;
  customerId: string[];
  componentIds: string[];
  startDate: string;
  targetDate?: string;  // Optional target completion date
  actualDate?: string;  // Optional actual completion date
  assigneeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Optional: Additional interfaces if needed
export interface AssignmentComment {
  id: string;
  assignmentId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentMetrics {
  totalAssignments: number;
  completedAssignments: number;
  averageCompletionTime: number; // in days
  statusDistribution: Record<AssignmentStatus, number>;
}

  export interface AssignmentCustomer {
    id: string;
    assignmentId: string;
    customerId: string;
    impact: CustomerImpact;
    requestedFeatures: string[];
    notes: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export enum CustomerImpact {
    BLOCKER = 'BLOCKER',        // Customer completely blocked
    MAJOR = 'MAJOR',            // Major functionality affected
    MINOR = 'MINOR',            // Minor functionality affected
    ENHANCEMENT = 'ENHANCEMENT'  // Feature enhancement request
  }
  
  export interface SLAConfig {
    id: string;
    componentId: string;
    criticalResponseTime: number; // Hours
    highResponseTime: number;     // Hours
    mediumResponseTime: number;   // Hours
    lowResponseTime: number;      // Hours
    criticalResolutionTime: number; // Hours
    highResolutionTime: number;     // Hours
    mediumResolutionTime: number;   // Hours
    lowResolutionTime: number;      // Hours
    createdAt: string;
    updatedAt: string;
    createdById: string; // Technical lead who created this config
  }