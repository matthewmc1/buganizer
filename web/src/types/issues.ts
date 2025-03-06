// web/src/types/issues.ts
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
    priority: Priority;
    severity: Severity;
    status: Status;
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
  
  // web/src/types/users.ts
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
  
  // web/src/types/views.ts
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
  
  // web/src/types/notifications.ts
  export enum NotificationType {
    ISSUE_CREATED = 'ISSUE_CREATED',
    ISSUE_UPDATED = 'ISSUE_UPDATED',
    ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
    COMMENT_ADDED = 'COMMENT_ADDED',
    SLA_AT_RISK = 'SLA_AT_RISK',
    SLA_BREACHED = 'SLA_BREACHED',
  }
  
  export interface NotificationPreference {
    userId: string;
    emailNotifications: boolean;
    slackNotifications: boolean;
    subscribedEvents: NotificationType[];
    updatedAt: string;
  }
  
  export interface Webhook {
    id: string;
    url: string;
    description: string;
    creatorId: string;
    eventTypes: NotificationType[];
    createdAt: string;
    lastCalledAt: string | null;
    lastSuccess: boolean | null;
  }
  
  // web/src/types/sla.ts
  export interface SLATarget {
    issueId?: string;
    priority: Priority;
    severity: Severity;
    targetDate: string;
    description: string;
  }
  
  export interface SLARiskIssue {
    issueId: string;
    title: string;
    dueDate: string;
    hoursRemaining: number;
    priority: Priority;
    severity: Severity;
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