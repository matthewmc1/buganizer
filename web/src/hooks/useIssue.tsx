// web/src/hooks/useIssues.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Issue } from '../types/issues';

interface UseIssuesOptions {
  initialFilter?: string;
  initialPage?: number;
  initialPageSize?: number;
  initialOrderBy?: keyof Issue;
  initialOrder?: 'asc' | 'desc';
}

interface FetchIssuesParams {
  filter?: string;
  page?: number;
  pageSize?: number;
  orderBy?: keyof Issue;
  order?: 'asc' | 'desc';
}

export const useIssues = (options: UseIssuesOptions = {}) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalIssues, setTotalIssues] = useState(0);
  
  const [filter, setFilter] = useState(options.initialFilter || 'is:open');
  const [page, setPage] = useState(options.initialPage || 0);
  const [pageSize, setPageSize] = useState(options.initialPageSize || 10);
  const [orderBy, setOrderBy] = useState<keyof Issue>(options.initialOrderBy || 'createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>(options.initialOrder || 'desc');

  const fetchIssues = useCallback(async (params: FetchIssuesParams = {}) => {
    const currentFilter = params.filter !== undefined ? params.filter : filter;
    const currentPage = params.page !== undefined ? params.page : page;
    const currentPageSize = params.pageSize !== undefined ? params.pageSize : pageSize;
    const currentOrderBy = params.orderBy !== undefined ? params.orderBy : orderBy;
    const currentOrder = params.order !== undefined ? params.order : order;

    setLoading(true);
    setError(null);

    try {
      // Convert to API params
      const apiParams = {
        query: currentFilter,
        page_size: currentPageSize,
        page_token: currentPage > 0 ? String(currentPage * currentPageSize) : '',
        // Add sorting params according to your API structure
      };

      const response = await axios.get('/api/v1/issues/search', { params: apiParams });
      
      setIssues(response.data.issues);
      setTotalIssues(response.data.totalResults);
      
      // Update state with the params that were actually used
      if (params.filter !== undefined) setFilter(params.filter);
      if (params.page !== undefined) setPage(params.page);
      if (params.pageSize !== undefined) setPageSize(params.pageSize);
      if (params.orderBy !== undefined) setOrderBy(params.orderBy);
      if (params.order !== undefined) setOrder(params.order);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, page, pageSize, orderBy, order]);

  // Initial fetch
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return {
    issues,
    loading,
    error,
    totalIssues,
    filter,
    page,
    pageSize,
    orderBy,
    order,
    setFilter,
    setPage,
    setPageSize,
    setOrderBy,
    setOrder,
    fetchIssues,
  };
};

// web/src/hooks/useIssue.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Issue } from '../types/issues';

export const useIssue = (issueId: string | undefined) => {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/v1/issues/${issueId}`);
      setIssue(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issue');
      console.error('Error fetching issue:', err);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  const updateIssue = useCallback(async (data: Partial<Issue>) => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.patch(`/api/v1/issues/${issueId}`, data);
      setIssue(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue');
      console.error('Error updating issue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  const deleteIssue = useCallback(async () => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      await axios.delete(`/api/v1/issues/${issueId}`);
      setIssue(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete issue');
      console.error('Error deleting issue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  // Initial fetch
  useEffect(() => {
    if (issueId) {
      fetchIssue();
    }
  }, [issueId, fetchIssue]);

  return {
    issue,
    loading,
    error,
    fetchIssue,
    updateIssue,
    deleteIssue,
  };
};

// web/src/hooks/useComments.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Comment, Attachment } from '../types/issues';

export const useComments = (issueId: string | undefined) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch comments
      const commentsResponse = await axios.get(`/api/v1/issues/${issueId}/comments`);
      setComments(commentsResponse.data);

      // Fetch attachments
      const attachmentsResponse = await axios.get(`/api/v1/issues/${issueId}/attachments`);
      setAttachments(attachmentsResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments and attachments');
      console.error('Error fetching comments and attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  const addComment = useCallback(async (content: string) => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/v1/issues/${issueId}/comments`, { content });
      setComments(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Error adding comment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  const addAttachment = useCallback(async (file: File) => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`/api/v1/issues/${issueId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setAttachments(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attachment');
      console.error('Error adding attachment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  // Initial fetch
  useEffect(() => {
    if (issueId) {
      fetchComments();
    }
  }, [issueId, fetchComments]);

  return {
    comments,
    attachments,
    loading,
    error,
    fetchComments,
    addComment,
    addAttachment,
  };
};

// web/src/hooks/useViews.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { SavedView } from '../types/views';

export const useViews = () => {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedViews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/v1/views');
      setSavedViews(response.data.views);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved views');
      console.error('Error fetching saved views:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveView = useCallback(async (name: string, queryString: string, isTeamView: boolean = false, teamId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        query_string: queryString,
        is_team_view: isTeamView,
        team_id: teamId,
      };

      const response = await axios.post('/api/v1/views', payload);
      setSavedViews(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save view');
      console.error('Error saving view:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteView = useCallback(async (viewId: string) => {
    setLoading(true);
    setError(null);

    try {
      await axios.delete(`/api/v1/views/${viewId}`);
      setSavedViews(prev => prev.filter(view => view.id !== viewId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete view');
      console.error('Error deleting view:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSavedViews();
  }, [fetchSavedViews]);

  return {
    savedViews,
    loading,
    error,
    fetchSavedViews,
    saveView,
    deleteView,
  };
};

// web/src/hooks/useAuth.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types/users';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Initialize axios with the token
  useEffect(() => {
    if (authState.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authState.token]);

  // Load user from token
  const loadUser = useCallback(async () => {
    if (!authState.token) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.get('/api/v1/auth/user');
      setAuthState({
        user: response.data,
        token: authState.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to authenticate',
      });
    }
  }, [authState.token]);

  // Login with Google
  const loginWithGoogle = useCallback(async (googleToken: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await axios.post('/api/v1/auth/google', { google_token: googleToken });
      
      localStorage.setItem('token', response.data.token);
      
      setAuthState({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return response.data.user;
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to login with Google',
      }));
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    loginWithGoogle,
    logout,
    loadUser,
  };
};