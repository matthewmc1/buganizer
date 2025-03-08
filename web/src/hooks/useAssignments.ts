// src/hooks/useAssignments.ts
import { useState, useCallback, useEffect } from 'react';
import { Assignment, AssignmentStatus } from '../types/assignments';
import { Issue } from '../types/issues';
import api from '../utils/api';

interface UseAssignmentsParams {
  initialFilter?: string;
  initialPage?: number;
  initialPageSize?: number;
  initialOrderBy?: keyof Assignment;
  initialOrder?: 'asc' | 'desc';
}

interface FetchAssignmentsParams {
  search?: string;
  status?: AssignmentStatus | '';
  page?: number;
  pageSize?: number;
  orderBy?: keyof Assignment;
  order?: 'asc' | 'desc';
}

export const useAssignments = (assignmentId?: string, params: UseAssignmentsParams = {}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [assignmentIssues, setAssignmentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAssignments, setTotalAssignments] = useState(0);
  
  const [filter, setFilter] = useState(params.initialFilter || '');
  const [page, setPage] = useState(params.initialPage || 0);
  const [pageSize, setPageSize] = useState(params.initialPageSize || 10);
  const [orderBy, setOrderBy] = useState<keyof Assignment>(params.initialOrderBy || 'createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>(params.initialOrder || 'desc');

  const fetchAssignments = useCallback(async (params: FetchAssignmentsParams = {}) => {
    const currentSearch = params.search !== undefined ? params.search : filter;
    const currentStatus = params.status !== undefined ? params.status : '';
    const currentPage = params.page !== undefined ? params.page : page;
    const currentPageSize = params.pageSize !== undefined ? params.pageSize : pageSize;
    const currentOrderBy = params.orderBy !== undefined ? params.orderBy : orderBy;
    const currentOrder = params.order !== undefined ? params.order : order;

    setLoading(true);
    setError(null);

    try {
      // Convert to API params
      const apiParams = {
        search: currentSearch,
        status: currentStatus,
        page_size: currentPageSize,
        page_token: currentPage > 0 ? String(currentPage * currentPageSize) : '',
        order_by: currentOrderBy,
        order_direction: currentOrder,
      };

      // For development/demo, simulate API response
      // const response = await api.assignments.searchAssignments(apiParams);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for development
      const mockAssignments: Assignment[] = Array.from({ length: currentPageSize }, (_, i) => ({
        id: `assignment-${currentPage * currentPageSize + i + 1}`,
        title: `Assignment ${currentPage * currentPageSize + i + 1}: Business Functionality`,
        description: 'This is a sample assignment description outlining the business functionality to be developed.',
        status: [
          AssignmentStatus.PLANNING, 
          AssignmentStatus.IN_PROGRESS, 
          AssignmentStatus.TESTING, 
          AssignmentStatus.COMPLETED, 
          AssignmentStatus.CANCELLED
        ][Math.floor(Math.random() * 5)],
        priority: ['P0', 'P1', 'P2', 'P3', 'P4'][Math.floor(Math.random() * 5)],
        teamId: `team-${Math.floor(Math.random() * 3) + 1}`,
        leadId: `user-${Math.floor(Math.random() * 3) + 1}`,
        customerId: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => `customer-${j + 1}`),
        componentIds: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => `comp-${j + 1}`),
        startDate: new Date(Date.now() - (Math.floor(Math.random() * 90) + 1) * 86400000).toISOString(),
        targetDate: Math.random() > 0.2 ? new Date(Date.now() + (Math.floor(Math.random() * 90) + 1) * 86400000).toISOString() : undefined,
        actualDate: Math.random() > 0.5 ? new Date(Date.now() + (Math.floor(Math.random() * 60) + 1) * 86400000).toISOString() : undefined,
        assigneeIds: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => `user-${j + 1}`),
        createdAt: new Date(Date.now() - (Math.floor(Math.random() * 90) + 1) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (Math.floor(Math.random() * 30) + 1) * 86400000).toISOString(),
      }));
      
      const mockTotal = 100;
      
      setAssignments(mockAssignments);
      setTotalAssignments(mockTotal);
      
      // Update state with the params that were actually used
      if (params.search !== undefined) setFilter(params.search);
      if (params.page !== undefined) setPage(params.page);
      if (params.pageSize !== undefined) setPageSize(params.pageSize);
      if (params.orderBy !== undefined) setOrderBy(params.orderBy);
      if (params.order !== undefined) setOrder(params.order);
      
      return mockAssignments;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      console.error('Error fetching assignments:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filter, page, pageSize, orderBy, order]);

  const fetchAssignmentById = useCallback(async (id: string) => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // const response = await api.assignments.getAssignment(id);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock assignment details
      const mockAssignment: Assignment = {
        id,
        title: `Assignment ${id}: Detailed Business Functionality`,
        description: 'Comprehensive description of the business functionality, including detailed requirements and objectives.',
        status: AssignmentStatus.IN_PROGRESS,
        priority: 'P1',
        teamId: 'team-1',
        leadId: 'user-1',
        customerId: ['customer-1'],
        componentIds: ['comp-1', 'comp-2'],
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        targetDate: new Date(Date.now() + 60 * 86400000).toISOString(),
        assigneeIds: ['user-1', 'user-2'],
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      };
      
      setAssignment(mockAssignment);
      return mockAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment details');
      console.error('Error fetching assignment details:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignmentIssues = useCallback(async (id: string) => {
    if (!id) return [];

    setLoadingIssues(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // const response = await api.assignments.getAssignmentIssues(id);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock issues associated with the assignment
      const mockIssues: Issue[] = Array.from({ length: 5 }, (_, i) => ({
        id: `issue-${i + 1}`,
        title: `Issue ${i + 1} for Assignment ${id}`,
        description: `Detailed description of issue ${i + 1}`,
        reproduceSteps: 'Steps to reproduce the issue',
        componentId: 'comp-1',
        reporterId: 'user-1',
        assigneeId: 'user-2',
        priority: ['P0', 'P1', 'P2', 'P3', 'P4'][Math.floor(Math.random() * 5)],
        severity: ['S0', 'S1', 'S2', 'S3'][Math.floor(Math.random() * 4)],
        status: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'CLOSED'][Math.floor(Math.random() * 5)],
        dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        createdAt: new Date(Date.now() - (5 - i) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (3 - i) * 86400000).toISOString(),
        labels: [`label-${i + 1}`, `label-${i + 6}`],
      }));
      
      setAssignmentIssues(mockIssues);
      return mockIssues;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment issues');
      console.error('Error fetching assignment issues:', err);
      throw err;
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  const createAssignment = useCallback(async (data: Partial<Assignment>) => {
    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // const response = await api.assignments.createAssignment(data);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a mock assignment with provided data
      const newAssignment: Assignment = {
        id: `assignment-${Date.now()}`,
        title: data.title || 'New Assignment',
        description: data.description || '',
        status: data.status || AssignmentStatus.PLANNING,
        priority: data.priority || 'P2',
        teamId: data.teamId || 'team-1',
        leadId: data.leadId || 'user-1',
        customerId: data.customerId || [],
        componentIds: data.componentIds || [],
        startDate: data.startDate || new Date().toISOString(),
        targetDate: data.targetDate,
        assigneeIds: data.assigneeIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add the new assignment to the list if it exists
      setAssignments(prev => [...prev, newAssignment]);
      setAssignment(newAssignment);
      
      return newAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      console.error('Error creating assignment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // const response = await api.assignments.updateAssignment(id, data);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the assignment
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === id 
            ? { 
                ...assignment, 
                ...data, 
                updatedAt: new Date().toISOString() 
              } 
            : assignment
        )
      );

      // Update the current assignment if it matches the ID
      setAssignment(prev => 
        prev && prev.id === id 
          ? { 
              ...prev, 
              ...data, 
              updatedAt: new Date().toISOString() 
            } 
          : prev
      );
      
      return { ...assignment, ...data, updatedAt: new Date().toISOString() };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
      console.error('Error updating assignment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [assignment]);

  const deleteAssignment = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // await api.assignments.deleteAssignment(id);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the assignment from the list
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      
      // Clear the current assignment if it matches the deleted ID
      if (assignment?.id === id) {
        setAssignment(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
      console.error('Error deleting assignment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [assignment]);

  // Initial fetch of assignments
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Fetch specific assignment details if an ID is provided
  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentById(assignmentId);
      fetchAssignmentIssues(assignmentId);
    }
  }, [assignmentId, fetchAssignmentById, fetchAssignmentIssues]);

  return {
    assignments,
    assignment,
    assignmentIssues,
    loading,
    loadingIssues,
    error,
    totalAssignments,
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
    fetchAssignments,
    fetchAssignmentById,
    fetchAssignmentIssues,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};