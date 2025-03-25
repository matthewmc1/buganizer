// src/hooks/useIssues.ts
import { useState, useCallback, useEffect } from 'react';
import { Issue } from '../types/issues';
import { parseFilterString, applyFilters } from '../utils/filterParser';

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

// Generate a set of mock issues for testing
const generateMockIssues = (count: number, startIndex: number = 0): Issue[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    // Randomize some properties for better testing
    const isEven = index % 2 === 0;
    const isThird = index % 3 === 0;
    const isFifth = index % 5 === 0;
    
    // Create due dates - some today, some tomorrow, some overdue, some next week
    let dueDate: string | null = null;
    const dueDateOption = index % 4;
    const today = new Date();
    
    if (dueDateOption === 0) {
      // Today
      dueDate = today.toISOString();
    } else if (dueDateOption === 1) {
      // Tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString();
    } else if (dueDateOption === 2) {
      // Next week
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      dueDate = nextWeek.toISOString();
    } else if (dueDateOption === 3) {
      // Overdue
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dueDate = yesterday.toISOString();
    }
    
    // Create different statuses
    let status = 'NEW';
    if (isEven) status = 'IN_PROGRESS';
    if (isThird) status = 'FIXED';
    if (isFifth) status = 'CLOSED';
    
    // Create different priorities
    let priority = 'P2'; // Default medium
    if (index % 10 === 0) priority = 'P0'; // Some critical
    else if (index % 7 === 0) priority = 'P1'; // Some high
    else if (index % 5 === 0) priority = 'P3'; // Some low
    else if (index % 13 === 0) priority = 'P4'; // Some trivial
    
    // Create different severities
    let severity = 'S2'; // Default moderate
    if (index % 11 === 0) severity = 'S0'; // Some critical
    else if (index % 7 === 0) severity = 'S1'; // Some major
    else if (index % 5 === 0) severity = 'S3'; // Some minor
    
    // Create different assignees (some unassigned)
    let assigneeId = null;
    if (isEven) assigneeId = 'user-1';
    else if (isThird) assigneeId = 'user-2';
    else if (isFifth) assigneeId = 'user-3';
    
    // Create different components
    const componentId = `comp-${(index % 5) + 1}`;
    
    // Create different labels
    const labels = [];
    if (index % 2 === 0) labels.push('bug');
    if (index % 3 === 0) labels.push('feature');
    if (index % 5 === 0) labels.push('documentation');
    if (index % 7 === 0) labels.push('enhancement');
    if (index % 11 === 0) labels.push('critical');
    
    return {
      id: `issue-${index + 1}`,
      title: `Issue ${index + 1}: ${isEven ? 'Bug' : 'Feature'} in ${componentId}`,
      description: `This is a ${isEven ? 'bug' : 'feature request'} found in the ${componentId} component.
        ${isThird ? 'This is high priority and needs immediate attention.' : ''}
        ${isFifth ? 'This is affecting multiple users.' : ''}`,
      reproduceSteps: isEven ? `
        1. Go to ${componentId}
        2. Click on the button
        3. Observe the error
      ` : '',
      componentId,
      reporterId: 'user-1',
      assigneeId,
      priority,
      severity,
      status,
      dueDate,
      createdAt: new Date(Date.now() - (index * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (index * 43200000)).toISOString(),
      labels,
    };
  });
};

// Create a large pool of mock issues
const ALL_MOCK_ISSUES = generateMockIssues(100);

export const useIssues = (options: UseIssuesOptions = {}) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalIssues, setTotalIssues] = useState(0);
  
  const [filter, setFilter] = useState(options.initialFilter || '');
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Parse the filter string
      const parsedFilters = parseFilterString(currentFilter);
      
      // Apply filters to our mock data
      let filteredIssues = applyFilters(ALL_MOCK_ISSUES, parsedFilters);
      
      // Apply sorting
      filteredIssues = [...filteredIssues].sort((a, b) => {
        const aValue = a[currentOrderBy];
        const bValue = b[currentOrderBy];
        
        if (aValue === null || aValue === undefined) return currentOrder === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return currentOrder === 'asc' ? 1 : -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return currentOrder === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        // For dates (already in ISO string format, so string comparison works)
        return currentOrder === 'asc' 
          ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
          : (bValue < aValue ? -1 : bValue > aValue ? 1 : 0);
      });
      
      // Get the total count before pagination
      const mockTotal = filteredIssues.length;
      
      // Apply pagination
      const startIndex = currentPage * currentPageSize;
      const paginatedIssues = filteredIssues.slice(startIndex, startIndex + currentPageSize);
      
      // Update state
      setIssues(paginatedIssues);
      setTotalIssues(mockTotal);
      
      // Update state with the params that were actually used
      if (params.filter !== undefined) setFilter(params.filter);
      if (params.page !== undefined) setPage(params.page);
      if (params.pageSize !== undefined) setPageSize(params.pageSize);
      if (params.orderBy !== undefined) setOrderBy(params.orderBy);
      if (params.order !== undefined) setOrder(params.order);
      
      return paginatedIssues;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
      console.error('Error fetching issues:', err);
      throw err;
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