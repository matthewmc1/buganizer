// src/hooks/useIssues.ts
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

      // For development/demo, simulate API response
      // Replace with real API call when available
      // const response = await axios.get('/api/v1/issues/search', { params: apiParams });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for development
      const mockIssues: Issue[] = Array.from({ length: currentPageSize }, (_, i) => ({
        id: `issue-${currentPage * currentPageSize + i + 1}`,
        title: `Sample Issue ${currentPage * currentPageSize + i + 1}`,
        description: 'This is a sample issue description',
        reproduceSteps: 'Steps to reproduce the issue',
        componentId: 'comp-1',
        reporterId: 'user-1',
        assigneeId: i % 3 === 0 ? null : 'user-2',
        priority: i % 5 === 0 ? 'P0' : i % 4 === 0 ? 'P1' : i % 3 === 0 ? 'P2' : i % 2 === 0 ? 'P3' : 'P4',
        severity: i % 4 === 0 ? 'S0' : i % 3 === 0 ? 'S1' : i % 2 === 0 ? 'S2' : 'S3',
        status: i % 7 === 0 ? 'CLOSED' : i % 5 === 0 ? 'FIXED' : i % 3 === 0 ? 'IN_PROGRESS' : 'NEW',
        dueDate: i % 4 === 0 ? new Date(Date.now() + 86400000).toISOString() : null,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
        labels: [`label-${i % 5 + 1}`, `label-${i % 3 + 6}`],
      }));
      
      const mockTotal = 100;
      
      setIssues(mockIssues);
      setTotalIssues(mockTotal);
      
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