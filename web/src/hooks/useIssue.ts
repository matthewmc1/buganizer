// src/hooks/useIssue.ts
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
      // For a real implementation, uncomment this
      // const response = await axios.get(`/api/v1/issues/${issueId}`);
      // setIssue(response.data);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data
      const mockIssue: Issue = {
        id: issueId,
        title: `Issue ${issueId}`,
        description: 'This is a detailed description of the issue. It explains what is happening and why it is a problem.',
        reproduceSteps: '1. Navigate to page\n2. Click on button\n3. Observe error',
        componentId: 'comp-1',
        reporterId: 'user-1',
        assigneeId: Math.random() > 0.3 ? 'user-2' : null,
        priority: Math.random() > 0.7 ? 'P0' : Math.random() > 0.5 ? 'P1' : Math.random() > 0.3 ? 'P2' : Math.random() > 0.1 ? 'P3' : 'P4',
        severity: Math.random() > 0.7 ? 'S0' : Math.random() > 0.4 ? 'S1' : Math.random() > 0.1 ? 'S2' : 'S3',
        status: Math.random() > 0.7 ? 'CLOSED' : Math.random() > 0.5 ? 'FIXED' : Math.random() > 0.3 ? 'IN_PROGRESS' : 'NEW',
        dueDate: Math.random() > 0.5 ? new Date(Date.now() + 86400000 * 5).toISOString() : null,
        createdAt: new Date(Date.now() - 864000000).toISOString(),
        updatedAt: new Date(Date.now() - 432000000).toISOString(),
        labels: ['bug', 'frontend', 'urgent'],
      };
      
      setIssue(mockIssue);
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
      // For a real implementation, uncomment this
      // const response = await axios.patch(`/api/v1/issues/${issueId}`, data);
      // setIssue(response.data);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the issue with new data
      setIssue(prevIssue => {
        if (!prevIssue) return null;
        return {
          ...prevIssue,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      });
      
      return issue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue');
      console.error('Error updating issue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId, issue]);

  const deleteIssue = useCallback(async () => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // await axios.delete(`/api/v1/issues/${issueId}`);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
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