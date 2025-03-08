// src/components/Dashboard/SlaComplianceChart.tsx
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveLineCanvas } from '@nivo/line';

interface ComplianceDataPoint {
  date: string;
  value: number;
}

interface SlaComplianceChartProps {
  data: ComplianceDataPoint[];
}

interface TooltipPoint {
  data: {
    xFormatted: string;
    yFormatted: string;
  };
}

// Create a wrapper component
const LineChartWrapper = (props: any) => {
  const { ResponsiveLineCanvas } = require('@nivo/line');
  return <ResponsiveLineCanvas {...props} />;
};

const SlaComplianceChart: React.FC<SlaComplianceChartProps> = ({ data }) => {
  const theme = useTheme();
  
  // Format month for display
  const formatMonth = (date: string) => {
    const [year, month] = date.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Format data for the chart
  const formattedData = [
    {
      id: 'SLA Compliance',
      color: theme.palette.primary.main,
      data: data.map(point => ({
        x: formatMonth(point.date),
        y: point.value,
      })),
    },
  ];

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%' 
      }}>
        <Typography variant="body1" color="text.secondary">
          No SLA compliance data available
        </Typography>
      </Box>
    );
  }

  // Get the minimum and maximum values to determine axis ranges
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Create a nice range with some padding
  const minY = Math.max(0, minValue - 5);
  const maxY = Math.min(100, maxValue + 5);

  return (
    <Box sx={{ height: '100%' }}>
      <div style={{ height: '100%' }}>
        <LineChartWrapper
          data={formattedData}
          margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: minY,
            max: maxY,
            stacked: false,
            reverse: false,
          }}
          yFormat=" >-.1f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Month',
            legendOffset: 36,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Compliance (%)',
            legendOffset: -40,
            legendPosition: 'middle',
          }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          colors={(theme: any) => [theme.palette.primary.main]}
          lineWidth={3}
          areaBaselineValue={minY}
          areaOpacity={0.15}
          enableArea={true}
          enableGridX={false}
          enableSlices="x"
          curve="monotoneX"
          animate={true}
          motionConfig="stiff"
          theme={{
            axis: {
              ticks: {
                text: {
                  fill: theme.palette.text.secondary,
                },
              },
              legend: {
                text: {
                  fill: theme.palette.text.primary,
                  fontSize: 12,
                  fontWeight: 600,
                },
              },
            },
            grid: {
              line: {
                stroke: theme.palette.divider,
                strokeWidth: 1,
              },
            },
            crosshair: {
              line: {
                stroke: theme.palette.text.secondary,
                strokeWidth: 1,
                strokeOpacity: 0.5,
              },
            },
          }}
          tooltip={({ point }: { point: TooltipPoint }) => (
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
                {point.data.xFormatted}: {point.data.yFormatted}%
              </Typography>
            </Box>
          )}
          markers={[
            {
              axis: 'y',
              value: 90,
              lineStyle: {
                stroke: theme.palette.success.main,
                strokeWidth: 2,
                strokeDasharray: '6 4',
              },
              legend: 'Target (90%)',
              legendPosition: 'top-right',
              textStyle: {
                fill: theme.palette.success.main,
                fontSize: 12,
                fontWeight: 'bold',
              },
            },
          ]}
          legends={[
            {
              anchor: 'top-left',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: -40,
              itemWidth: 100,
              itemHeight: 20,
              itemsSpacing: 4,
              symbolSize: 20,
              symbolShape: 'circle',
              itemDirection: 'left-to-right',
              itemTextColor: theme.palette.text.secondary,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: theme.palette.text.primary,
                    itemBackground: theme.palette.action.hover,
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </Box>
  );
};

export default SlaComplianceChart;