// src/components/Dashboard/CustomDashboardCharts.tsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import { Priority } from '../../types/issues';

/**
 * Component for displaying a simple SLA compliance trend
 * This simplified version works when the SlaComplianceChart may not be available
 */
export const SimpleSLAComplianceTrend = ({ data }: { data: { date: string, value: number }[] }) => {
  const theme = useTheme();

  // If no data is provided, show empty state
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No compliance data available</Typography>
      </Box>
    );
  }

  // Get min and max values for better visualization
  const minValue = Math.min(...data.map(item => item.value));
  const maxValue = Math.max(...data.map(item => item.value));
  const range = maxValue - minValue || 10; // Prevent division by zero

  // Calculate normalized heights (40-90% of container height)
  const getBarHeight = (value: number) => {
    return 40 + ((value - minValue) / range) * 50;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" gutterBottom>Trend (Last 6 Months)</Typography>
      
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'space-around',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 2,
        position: 'relative'
      }}>
        {/* Target line */}
        <Box sx={{ 
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${100 - getBarHeight(90)}%`, // 90% target line
          borderTop: '2px dashed',
          borderColor: theme.palette.success.main,
          zIndex: 1
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              right: 0, 
              top: -20, 
              color: theme.palette.success.main 
            }}
          >
            Target (90%)
          </Typography>
        </Box>
        
        {data.map((item, index) => (
          <Box 
            key={index} 
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}
          >
            <Box sx={{ 
              height: `${getBarHeight(item.value)}%`, 
              width: 16, 
              backgroundColor: item.value >= 90 
                ? theme.palette.success.main 
                : item.value >= 80 
                  ? theme.palette.warning.main 
                  : theme.palette.error.main,
              borderRadius: 8,
              mb: 1
            }} />
            <Typography variant="caption" color="text.secondary">
              {item.date.substring(5)} {/* Show only month from YYYY-MM format */}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Typography variant="body2" fontWeight="medium">Start: {data[0].value}%</Typography>
        <Typography variant="body2" fontWeight="medium">Current: {data[data.length - 1].value}%</Typography>
      </Box>
    </Box>
  );
};

/**
 * Component for displaying issues by priority in a simple bar chart
 */
export const SimpleIssuesByPriorityChart = ({ data }: { data: { priority: string, count: number }[] }) => {
  const theme = useTheme();
  
  // Get the total count for percentage calculation
  const totalCount = data.reduce((sum, item) => sum + item.count, 0) || 1; // Prevent division by zero
  
  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case Priority.P0: return theme.palette.error.main;
      case Priority.P1: return theme.palette.error.light;
      case Priority.P2: return theme.palette.warning.main;
      case Priority.P3: return theme.palette.primary.main;
      case Priority.P4: return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };
  
  // Priority order for display (critical to trivial)
  const priorityOrder = [Priority.P0, Priority.P1, Priority.P2, Priority.P3, Priority.P4];
  
  // Sort data by priority order
  const sortedData = [...data].sort((a, b) => {
    return priorityOrder.indexOf(a.priority as Priority) - priorityOrder.indexOf(b.priority as Priority);
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" gutterBottom>Issue Distribution</Typography>
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
        {sortedData.map((item) => (
          <Box key={item.priority} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 60 }}>{item.priority}</Typography>
            <Box sx={{ flex: 1, mx: 2 }}>
              <Box 
                sx={{ 
                  height: 12, 
                  width: `${(item.count / totalCount) * 100}%`, 
                  bgcolor: getPriorityColor(item.priority),
                  borderRadius: 6,
                  minWidth: 4
                }} 
              />
            </Box>
            <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
              {item.count} ({Math.round((item.count / totalCount) * 100)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Dashboard KPI summary cards
 */
export const SLAComplianceKPIs = ({ metrics }: { metrics: any }) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <Card sx={{ height: '100%', boxShadow: 'none', bgcolor: alpha(theme.palette.success.light, 0.1) }}>
          <CardContent>
            <Typography variant="h5" color="success.main" gutterBottom fontWeight="bold">
              {metrics?.currentComplianceRate || 0}%
            </Typography>
            <Typography variant="body2">
              Current SLA Compliance
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={6}>
        <Card sx={{ height: '100%', boxShadow: 'none', bgcolor: alpha(theme.palette.warning.light, 0.1) }}>
          <CardContent>
            <Typography variant="h5" color="warning.main" gutterBottom fontWeight="bold">
              {metrics?.atRiskCount || 0}
            </Typography>
            <Typography variant="body2">
              Issues At Risk
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={6}>
        <Card sx={{ height: '100%', boxShadow: 'none', bgcolor: alpha(theme.palette.error.light, 0.1) }}>
          <CardContent>
            <Typography variant="h5" color="error.main" gutterBottom fontWeight="bold">
              {metrics?.breachedThisWeek || 0}
            </Typography>
            <Typography variant="body2">
              SLA Breaches This Week
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={6}>
        <Card sx={{ height: '100%', boxShadow: 'none', bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
          <CardContent>
            <Typography variant="h5" color="primary.main" gutterBottom fontWeight="bold">
              {metrics?.averageResolutionTime?.P2 
                ? `${Math.round(metrics.averageResolutionTime.P2)}h` 
                : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Avg. P2 Resolution Time
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};