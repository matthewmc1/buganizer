// src/types/notifications.ts
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