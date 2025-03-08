// src/hooks/useViews.ts
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
      // For a real implementation, uncomment this
      // const response = await axios.get('/api/v1/views');
      // setSavedViews(response.data.views);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock saved views
      const mockViews: SavedView[] = [
        {
          id: 'view-1',
          name: 'My Open Issues',
          ownerId: 'user-1',
          isTeamView: false,
          queryString: 'is:open assignee:me',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'view-2',
          name: 'Critical Issues',
          ownerId: 'user-1',
          isTeamView: true,
          teamId: 'team-1',
          queryString: 'is:open priority:p0',
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'view-3',
          name: 'Frontend Bugs',
          ownerId: 'user-2',
          isTeamView: true,
          teamId: 'team-1',
          queryString: 'is:open component:frontend label:bug',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
      
      setSavedViews(mockViews);
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
      // For a real implementation, uncomment this
      /*
      const payload = {
        name,
        query_string: queryString,
        is_team_view: isTeamView,
        team_id: teamId,
      };

      const response = await axios.post('/api/v1/views', payload);
      setSavedViews(prev => [...prev, response.data]);
      return response.data;
      */
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock new view
      const newView: SavedView = {
        id: `view-${Date.now()}`,
        name,
        ownerId: 'user-1', // Current user
        isTeamView,
        teamId,
        queryString,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setSavedViews(prev => [...prev, newView]);
      return newView;
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
      // For a real implementation, uncomment this
      // await axios.delete(`/api/v1/views/${viewId}`);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
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