// src/hooks/useSLA.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { SLATarget, SLARiskIssue, SLAStats } from '../types/sla';
import { Priority, Severity } from '../types/issues';

export const useSLA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateSLATarget = useCallback(async (priority: Priority, severity: Severity, componentId?: string) => {
    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      /*
      const response = await axios.post('/api/v1/sla/calculate', {
        priority,
        severity,
        component_id: componentId,
      });
      return response.data;
      */
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Calculate mock SLA based on priority and severity
      let hoursToAdd = 72; // Default (P2)
      
      // Adjust by priority
      if (priority === 'P0') hoursToAdd = 4;
      else if (priority === 'P1') hoursToAdd = 24;
      else if (priority === 'P2') hoursToAdd = 72;
      else if (priority === 'P3') hoursToAdd = 168;
      else if (priority === 'P4') hoursToAdd = 336;
      
      // Adjust by severity
      if (severity === 'S0') hoursToAdd = Math.floor(hoursToAdd / 2);
      else if (severity === 'S1') hoursToAdd = Math.floor(hoursToAdd * 0.75);
      else if (severity === 'S3') hoursToAdd = Math.floor(hoursToAdd * 1.5);
      
      const targetDate = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
      
      // Create mock response
      const mockTarget: SLATarget = {
        priority,
        severity,
        targetDate: targetDate.toISOString(),
        description: `Target resolution: ${hoursToAdd} hours (${targetDate.toLocaleString()})`,
      };
      
      return mockTarget;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate SLA target');
      console.error('Error calculating SLA target:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSLARisk = useCallback(async (teamId?: string, includeClosed = false) => {
    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      /*
      const response = await axios.get('/api/v1/sla/risk', {
        params: {
          team_id: teamId,
          include_closed: includeClosed,
        },
      });
      return response.data;
      */
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock at-risk issues
      const mockAtRiskIssues: SLARiskIssue[] = Array.from({ length: 3 }, (_, i) => ({
        issueId: `issue-${i + 1}`,
        title: `Critical Issue ${i + 1}`,
        dueDate: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(), // 1-3 hours from now
        hoursRemaining: i + 1,
        priority: i === 0 ? 'P0' : 'P1',
        severity: i === 0 ? 'S0' : i === 1 ? 'S1' : 'S2',
      }));
      
      return {
        atRiskIssues: mockAtRiskIssues,
        totalAtRisk: mockAtRiskIssues.length,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check SLA risk');
      console.error('Error checking SLA risk:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSLAStats = useCallback(async (params: { componentId?: string, teamId?: string, startDate?: string, endDate?: string }) => {
    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      /*
      const response = await axios.get('/api/v1/sla/stats', {
        params: {
          component_id: params.componentId,
          team_id: params.teamId,
          start_date: params.startDate,
          end_date: params.endDate,
        },
      });
      return response.data;
      */
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock SLA stats
      const mockStats: SLAStats = {
        totalIssues: 100,
        metSla: 85,
        missedSla: 15,
        slaCompliancePercentage: 85,
        issuesByPriority: {
          'P0': 5,
          'P1': 15,
          'P2': 30,
          'P3': 40,
          'P4': 10,
        },
        issuesBySeverity: {
          'S0': 3,
          'S1': 12,
          'S2': 45,
          'S3': 40,
        },
        complianceByPriority: {
          'P0': 80,
          'P1': 85,
          'P2': 90,
          'P3': 92,
          'P4': 95,
        },
        complianceBySeverity: {
          'S0': 75,
          'S1': 80,
          'S2': 88,
          'S3': 95,
        },
      };
      
      return mockStats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get SLA stats');
      console.error('Error getting SLA stats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Additional utility function for SLA calculations
  const calculateTimeRemaining = useCallback((dueDate: string): { hoursRemaining: number; isAtRisk: boolean } => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Consider "at risk" if less than 8 hours remaining
    return {
      hoursRemaining: Math.max(0, Math.round(diffHours * 10) / 10), // Round to 1 decimal
      isAtRisk: diffHours < 8
    };
  }, []);

  // Get SLA metrics for dashboard
  const getDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Mock dashboard metrics
      return {
        currentComplianceRate: 87.5, // Percentage
        complianceTrend: [
          { date: '2023-01', value: 82 },
          { date: '2023-02', value: 84 },
          { date: '2023-03', value: 86 },
          { date: '2023-04', value: 85 },
          { date: '2023-05', value: 88 },
          { date: '2023-06', value: 87.5 },
        ],
        atRiskCount: 5,
        breachedThisWeek: 3,
        averageResolutionTime: {
          'P0': 3.2, // In hours
          'P1': 18.5,
          'P2': 65.3,
          'P3': 156.7,
          'P4': 312.5,
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get dashboard metrics');
      console.error('Error getting dashboard metrics:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calculateSLATarget,
    checkSLARisk,
    getSLAStats,
    calculateTimeRemaining,
    getDashboardMetrics,
  };
};