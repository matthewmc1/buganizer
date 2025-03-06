// web/src/utils/api.ts
import axios from 'axios';

// Configure axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
  // Authentication
  auth: {
    // Authenticate with Google
    googleLogin: (googleToken: string) => 
      apiClient.post('/api/v1/auth/google', { google_token: googleToken }),
      
    // Get current user
    getCurrentUser: () => 
      apiClient.get('/api/v1/auth/user'),
      
    // Validate token
    validateToken: (token: string) => 
      apiClient.post('/api/v1/auth/validate', { token }),
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
  },
  
  // Comments
  comments: {
    // Get comments for an issue
    getComments: (issueId: string) => 
      apiClient.get(`/api/v1/issues/${issueId}/comments`),
      
    // Add a comment to an issue
    addComment: (issueId: string, content: string) => 
      apiClient.post(`/api/v1/issues/${issueId}/comments`, { content }),
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
      
      return apiClient.post(`/api/v1/issues/${issueId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
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
    createView: (data: any) => 
      apiClient.post('/api/v1/views', data),
      
    // Delete a view
    deleteView: (id: string) => 
      apiClient.delete(`/api/v1/views/${id}`),
  },
  
  // Components
  components: {
    // Get all components
    getComponents: () => 
      apiClient.get('/api/v1/components'),
      
    // Get a specific component
    getComponent: (id: string) => 
      apiClient.get(`/api/v1/components/${id}`),
  },
  
  // Teams
  teams: {
    // Get all teams
    getTeams: () => 
      apiClient.get('/api/v1/teams'),
      
    // Get a specific team
    getTeam: (id: string) => 
      apiClient.get(`/api/v1/teams/${id}`),
      
    // Get team members
    getTeamMembers: (id: string) => 
      apiClient.get(`/api/v1/teams/${id}/members`),
  },
  
  // Users
  users: {
    // Get all users
    getUsers: () => 
      apiClient.get('/api/v1/users'),
      
    // Get a specific user
    getUser: (id: string) => 
      apiClient.get(`/api/v1/users/${id}`),
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
    getSLAStats: (componentId?: string, teamId?: string, startDate?: string, endDate?: string) => 
      apiClient.get('/api/v1/sla/stats', { 
        params: { 
          component_id: componentId, 
          team_id: teamId, 
          start_date: startDate, 
          end_date: endDate 
        } 
      }),
  }
};

export default api;