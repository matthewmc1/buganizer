// src/components/Dashboard/IssuesByPriorityChart.tsx
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveBar } from '@nivo/bar';
import { Priority } from '../../types/issues';

interface PriorityData {
  priority: string;
  count: number;
}

interface TooltipData {
  priority: string;
  count: number;
  color: string;
}

interface IssuesByPriorityChartProps {
  data: PriorityData[];
}

const IssuesByPriorityChart: React.FC<IssuesByPriorityChartProps> = ({ data }) => {
  const theme = useTheme();
  
  // Map priority to color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case Priority.P0:
        return theme.palette.error.main;
      case Priority.P1:
        return theme.palette.error.light;
      case Priority.P2:
        return theme.palette.warning.main;
      case Priority.P3:
        return theme.palette.info.main;
      case Priority.P4:
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Format data for the chart
  const chartData = data.map(item => ({
    priority: item.priority,
    count: item.count,
    color: getPriorityColor(item.priority),
  }));

  // Sort data by priority
  const sortedData = [...chartData].sort((a, b) => {
    const priorityOrder = [Priority.P0, Priority.P1, Priority.P2, Priority.P3, Priority.P4];
    return priorityOrder.indexOf(a.priority as Priority) - priorityOrder.indexOf(b.priority as Priority);
  });

  // If no data, show a message
  if (!data || data.every(item => item.count === 0)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%' 
      }}>
        <Typography variant="body1" color="text.secondary">
          No issues assigned to you
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      <ResponsiveBar
        data={sortedData}
        keys={['count']}
        indexBy="priority"
        margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={({ data }) => data.color}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Priority',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Count',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        role="application"
        ariaLabel="Issues by priority"
        barAriaLabel={e => `${e.indexValue}: ${e.value} issues`}
        tooltip={({ data }: { data: TooltipData }) => (
          <Box 
            sx={{ 
              backgroundColor: theme.palette.background.paper, 
              p: 1, 
              border: '1px solid',
              borderColor: theme.palette.divider,
              borderRadius: 1,
              boxShadow: theme.shadows[2],
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {data.priority}: {data.count} issues
            </Typography>
          </Box>
        )}
      />
    </Box>
  );
};

export default IssuesByPriorityChart;