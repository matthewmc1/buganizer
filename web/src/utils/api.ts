// src/utils/api.ts
import axios from 'axios';
import { decodeJwt } from './jwt';
import { Role } from '../types/permissions';

// Configure axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and organization context to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add organization context to all requests
    const organizationId = api.getCurrentOrganizationId();
    if (organizationId) {
      // For GET requests, add as query param
      if (config.method === 'get') {
        config.params = { ...config.params, organization_id: organizationId };
      } 
      // For other methods, add to the request body if it's JSON
      else if (config.data && typeof config.data === 'object') {
        config.data.organization_id = organizationId;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Get current organization ID from token
  getCurrentOrganizationId: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const decoded = decodeJwt(token);
      return decoded.organizationId;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  },
  
  // Authentication
  auth: {
    // Login with email/password
    login: (email: string, password: string) => 
      apiClient.post('/api/v1/auth/login', { email, password }),
      
    // Login with Google
    googleLogin: (googleToken: string) => 
      apiClient.post('/api/v1/auth/google', { google_token: googleToken }),
      
    // Register a new organization
    register: (data: { 
      organizationName: string, 
      domain: string,
      name: string, 
      email: string, 
      password: string 
    }) => apiClient.post('/api/v1/auth/register', data),
    
    // Get current user
    getCurrentUser: () => 
      apiClient.get('/api/v1/auth/user'),
      
    // Logout
    logout: () => 
      apiClient.post('/api/v1/auth/logout'),
      
    // Validate token
    validateToken: (token: string) => 
      apiClient.post('/api/v1/auth/validate', { token }),
  },
  
  // Organizations
  organizations: {
    // Get current organization
    getOrganization: (id: string) => 
      apiClient.get(`/api/v1/organizations/${id}`),
      
    // Update organization
    updateOrganization: (id: string, data: any) => 
      apiClient.patch(`/api/v1/organizations/${id}`, data),
      
    // Get organization settings
    getSettings: (id: string) => 
      apiClient.get(`/api/v1/organizations/${id}/settings`),
      
    // Update organization settings
    updateSettings: (id: string, data: any) => 
      apiClient.patch(`/api/v1/organizations/${id}/settings`, data),
      
    // Add additional domain
    addDomain: (id: string, domain: string) =>
      apiClient.post(`/api/v1/organizations/${id}/domains`, { domain }),
      
    // Remove additional domain
    removeDomain: (id: string, domain: string) =>
      apiClient.delete(`/api/v1/organizations/${id}/domains/${domain}`),
      
    // Verify domain
    verifyDomain: (id: string, domain: string, verificationMethod: string) =>
      apiClient.post(`/api/v1/organizations/${id}/domains/${domain}/verify`, { 
        verification_method: verificationMethod 
      }),
      
    // Update SSO settings
    updateSSOSettings: (id: string, data: {
      enabled: boolean;
      provider: string;
      domain: string;
      clientId: string;
      clientSecret: string;
    }) => apiClient.patch(`/api/v1/organizations/${id}/sso`, data),
  },
  
  // Users and Roles
  users: {
    // Get all users in the organization
    getUsers: () => 
      apiClient.get('/api/v1/users'),
      
    // Get a specific user
    getUser: (id: string) => 
      apiClient.get(`/api/v1/users/${id}`),
      
    // Invite a user to the organization
    inviteUser: (data: { email: string, role: string, teamId?: string }) => 
      apiClient.post('/api/v1/users/invite', data),
      
    // Remove a user from the organization
    removeUser: (id: string) =>
      apiClient.delete(`/api/v1/users/${id}`),
      
    // Update user profile
    updateUser: (id: string, data: any) =>
      apiClient.patch(`/api/v1/users/${id}`, data),
      
    // Get user roles
    getUserRoles: (userId: string, organizationId: string) => 
      apiClient.get(`/api/v1/users/${userId}/roles`, { 
        params: { organization_id: organizationId } 
      }),
      
    // Assign a role to a user
    assignRole: (userId: string, data: { role: Role, teamId?: string }) => 
      apiClient.post(`/api/v1/users/${userId}/roles`, data),
      
    // Update a user's role
    updateRole: (userId: string, roleId: string, data: { role: Role }) =>
      apiClient.patch(`/api/v1/users/${userId}/roles/${roleId}`, data),
      
    // Remove a role from a user
    removeRole: (userId: string, roleId: string) => 
      apiClient.delete(`/api/v1/users/${userId}/roles/${roleId}`),
  },
  
  // Teams
  teams: {
    // Get all teams
    getTeams: () => 
      apiClient.get('/api/v1/teams'),
      
    // Get a specific team
    getTeam: (id: string) => 
      apiClient.get(`/api/v1/teams/${id}`),
      
    // Create a new team
    createTeam: (data: {
      name: string;
      description?: string;
      leadId?: string | null;
      organizationId?: string;
    }) => apiClient.post('/api/v1/teams', data),
    
    // Update a team
    updateTeam: (id: string, data: {
      name?: string;
      description?: string;
      leadId?: string | null;
    }) => apiClient.patch(`/api/v1/teams/${id}`, data),
    
    // Delete a team
    deleteTeam: (id: string) =>
      apiClient.delete(`/api/v1/teams/${id}`),
      
    // Get team members
    getTeamMembers: (id: string) => 
      apiClient.get(`/api/v1/teams/${id}/members`),
      
    // Add a member to a team
    addTeamMember: (teamId: string, data: { email: string, role: Role }) =>
      apiClient.post(`/api/v1/teams/${teamId}/members`, data),
      
    // Update a team member's role
    updateTeamMember: (teamId: string, userId: string, data: { role: Role }) =>
      apiClient.patch(`/api/v1/teams/${teamId}/members/${userId}`, data),
      
    // Remove a member from a team
    removeTeamMember: (teamId: string, userId: string) =>
      apiClient.delete(`/api/v1/teams/${teamId}/members/${userId}`),
      
    // Get team issues
    getTeamIssues: (teamId: string) =>
      apiClient.get(`/api/v1/teams/${teamId}/issues`),
      
    // Get team assignments
    getTeamAssignments: (teamId: string) =>
      apiClient.get(`/api/v1/teams/${teamId}/assignments`),
  },
  
  // Issues
  issues: {
    // Search issues
    search: (query: string, pageSize = 10, pageToken = '') => 
      apiClient.get('/api/v1/issues/search', { 
        params: { query, page_size: pageSize, page_token: pageToken } 
      }),
      
    // Get an issue by ID
    getIssue: (id: string) => 
      apiClient.get(`/api/v1/issues/${id}`),
      
    // Create a new issue
    createIssue: (data: any) => 
      apiClient.post('/api/v1/issues', data),
      
    // Update an issue
    updateIssue: (id: string, data: any) => 
      apiClient.patch(`/api/v1/issues/${id}`, data),
      
    // Delete an issue
    deleteIssue: (id: string) => 
      apiClient.delete(`/api/v1/issues/${id}`),
      
    // Change issue status
    changeStatus: (id: string, status: string, comment?: string) =>
      apiClient.post(`/api/v1/issues/${id}/status`, { status, comment }),
      
    // Assign issue to user
    assignIssue: (id: string, userId: string) =>
      apiClient.post(`/api/v1/issues/${id}/assign`, { user_id: userId }),
  },
  
  // Comments
  comments: {
    // Get comments for an issue
    getComments: (issueId: string) => 
      apiClient.get(`/api/v1/issues/${issueId}/comments`),
      
    // Add a comment to an issue
    addComment: (issueId: string, content: string) => 
      apiClient.post(`/api/v1/issues/${issueId}/comments`, { content }),
      
    // Update a comment
    updateComment: (issueId: string, commentId: string, content: string) =>
      apiClient.patch(`/api/v1/issues/${issueId}/comments/${commentId}`, { content }),
      
    // Delete a comment
    deleteComment: (issueId: string, commentId: string) =>
      apiClient.delete(`/api/v1/issues/${issueId}/comments/${commentId}`),
  },
  
  // Attachments
  attachments: {
    // Get attachments for an issue
    getAttachments: (issueId: string) => 
      apiClient.get(`/api/v1/issues/${issueId}/attachments`),
      
    // Add an attachment to an issue
    addAttachment: (issueId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add organization ID to form data as well
      const orgId = api.getCurrentOrganizationId();
      if (orgId) {
        formData.append('organization_id', orgId);
      }
      
      return apiClient.post(`/api/v1/issues/${issueId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    
    // Delete an attachment
    deleteAttachment: (issueId: string, attachmentId: string) =>
      apiClient.delete(`/api/v1/issues/${issueId}/attachments/${attachmentId}`),
  },
  
  // Components
  components: {
    // Get all components
    getComponents: () => 
      apiClient.get('/api/v1/components'),
      
    // Get a specific component
    getComponent: (id: string) => 
      apiClient.get(`/api/v1/components/${id}`),
      
    // Create a new component
    createComponent: (data: {
      name: string;
      description?: string;
      ownerId?: string;
      teamId?: string;
    }) => apiClient.post('/api/v1/components', data),
    
    // Update a component
    updateComponent: (id: string, data: any) =>
      apiClient.patch(`/api/v1/components/${id}`, data),
      
    // Delete a component
    deleteComponent: (id: string) =>
      apiClient.delete(`/api/v1/components/${id}`),
  },
  
  // SLA
  sla: {
    // Calculate SLA target
    calculateSLATarget: (priority: string, severity: string, componentId?: string) => 
      apiClient.post('/api/v1/sla/calculate', { priority, severity, component_id: componentId }),
      
    // Check SLA risk
    checkSLARisk: (teamId?: string, includeClosed = false) => 
      apiClient.get('/api/v1/sla/risk', { 
        params: { team_id: teamId, include_closed: includeClosed } 
      }),
      
    // Get SLA stats
    getSLAStats: (params: { componentId?: string, teamId?: string, startDate?: string, endDate?: string }) => 
      apiClient.get('/api/v1/sla/stats', { 
        params: { 
          component_id: params.componentId, 
          team_id: params.teamId, 
          start_date: params.startDate, 
          end_date: params.endDate 
        } 
      }),
      
    // Configure SLA for a component
    configureSLA: (componentId: string, config: {
      criticalResponseTime: number;
      highResponseTime: number;
      mediumResponseTime: number;
      lowResponseTime: number;
      criticalResolutionTime: number;
      highResolutionTime: number;
      mediumResolutionTime: number;
      lowResolutionTime: number;
    }) => apiClient.post(`/api/v1/sla/components/${componentId}`, config),
  },
  
  // Assignments
  assignments: {
    // Search assignments
    searchAssignments: (params: {
      search?: string;
      status?: string;
      page_size?: number;
      page_token?: string;
      order_by?: string;
      order_direction?: string;
    }) => apiClient.get('/api/v1/assignments/search', { params }),
    
    // Get a specific assignment
    getAssignment: (id: string) => 
      apiClient.get(`/api/v1/assignments/${id}`),
    
    // Get issues for an assignment
    getAssignmentIssues: (id: string) => 
      apiClient.get(`/api/v1/assignments/${id}/issues`),
    
    // Create a new assignment
    createAssignment: (data: any) => 
      apiClient.post('/api/v1/assignments', data),
    
    // Update an existing assignment
    updateAssignment: (id: string, data: any) => 
      apiClient.patch(`/api/v1/assignments/${id}`, data),
    
    // Delete an assignment
    deleteAssignment: (id: string) => 
      apiClient.delete(`/api/v1/assignments/${id}`),
      
    // Add issue to assignment
    addIssueToAssignment: (assignmentId: string, issueId: string) =>
      apiClient.post(`/api/v1/assignments/${assignmentId}/issues`, { issue_id: issueId }),
      
    // Remove issue from assignment
    removeIssueFromAssignment: (assignmentId: string, issueId: string) =>
      apiClient.delete(`/api/v1/assignments/${assignmentId}/issues/${issueId}`),
  },
  
  // Reports
  reports: {
    // Get issue statistics
    getIssueStats: (params: {
      teamId?: string;
      componentId?: string;
      startDate?: string;
      endDate?: string;
    }) => apiClient.get('/api/v1/reports/issues', { params }),
    
    // Get SLA compliance report
    getSLAComplianceReport: (params: {
      teamId?: string;
      componentId?: string;
      startDate?: string;
      endDate?: string;
    }) => apiClient.get('/api/v1/reports/sla-compliance', { params }),
    
    // Get team performance report
    getTeamPerformanceReport: (params: {
      teamId?: string;
      startDate?: string;
      endDate?: string;
    }) => apiClient.get('/api/v1/reports/team-performance', { params }),
    
    // Export report data
    exportReport: (reportType: string, format: 'csv' | 'excel' | 'pdf', params: any) =>
      apiClient.get(`/api/v1/reports/export/${reportType}`, {
        params: { ...params, format },
        responseType: 'blob',
      }),
  },
  
  // Saved Views
  views: {
    // Get all views for the current user
    getViews: () => 
      apiClient.get('/api/v1/views'),
      
    // Get a specific view
    getView: (id: string) => 
      apiClient.get(`/api/v1/views/${id}`),
      
    // Create a new view
    createView: (data: {
      name: string;
      queryString: string;
      isTeamView?: boolean;
      teamId?: string;
    }) => apiClient.post('/api/v1/views', data),
    
    // Update a view
    updateView: (id: string, data: any) =>
      apiClient.patch(`/api/v1/views/${id}`, data),
      
    // Delete a view
    deleteView: (id: string) => 
      apiClient.delete(`/api/v1/views/${id}`),
  },
  
  // Notifications
  notifications: {
    // Get notifications for current user
    getNotifications: (params: { page?: number, pageSize?: number, unreadOnly?: boolean }) =>
      apiClient.get('/api/v1/notifications', { params }),
      
    // Mark notification as read
    markAsRead: (id: string) =>
      apiClient.post(`/api/v1/notifications/${id}/read`),
      
    // Mark all notifications as read
    markAllAsRead: () =>
      apiClient.post('/api/v1/notifications/read-all'),
      
    // Get notification preferences
    getNotificationPreferences: () =>
      apiClient.get('/api/v1/notifications/preferences'),
      
    // Update notification preferences
    updateNotificationPreferences: (data: {
      emailNotifications: boolean;
      slackNotifications: boolean;
      subscribedEvents: string[];
    }) => apiClient.patch('/api/v1/notifications/preferences', data),
  },
  
  // Webhooks
  webhooks: {
    // Get all webhooks
    getWebhooks: () =>
      apiClient.get('/api/v1/webhooks'),
      
    // Create a webhook
    createWebhook: (data: {
      url: string;
      description: string;
      eventTypes: string[];
    }) => apiClient.post('/api/v1/webhooks', data),
    
    // Update a webhook
    updateWebhook: (id: string, data: any) =>
      apiClient.patch(`/api/v1/webhooks/${id}`, data),
      
    // Delete a webhook
    deleteWebhook: (id: string) =>
      apiClient.delete(`/api/v1/webhooks/${id}`),
      
    // Test a webhook
    testWebhook: (id: string) =>
      apiClient.post(`/api/v1/webhooks/${id}/test`),
  },
  
  // API Tokens
  apiTokens: {
    // Get all API tokens
    getTokens: () =>
      apiClient.get('/api/v1/api-tokens'),
      
    // Create a new API token
    createToken: (data: {
      name: string;
      description?: string;
      expiry?: string;
      scopes: string[];
    }) => apiClient.post('/api/v1/api-tokens', data),
    
    // Revoke an API token
    revokeToken: (id: string) =>
      apiClient.delete(`/api/v1/api-tokens/${id}`),
  },
  
  // Audit Log
  auditLog: {
    // Get audit log entries
    getEntries: (params: {
      userId?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    }) => apiClient.get('/api/v1/audit-log', { params }),
  }
};

export default api;