import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fallback data in case no data is provided
const fallbackData = [
  { priority: 'No Data', count: 0, color: '#d1d5db' }
];

// Define tooltip props
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: any;
  }>;
  label?: string;
}

// Custom tooltip with proper typing
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
        <p className="font-medium">{`${label}: ${payload[0].value} issues`}</p>
      </div>
    );
  }
  return null;
};

interface PriorityData {
  priority: string;
  count: number;
  color: string;
}

interface IssuesByPriorityChartProps {
  data: PriorityData[];
}

const IssuesByPriorityChart: React.FC<IssuesByPriorityChartProps> = ({ data = [] }) => {
  // Use provided data or fallback if empty
  const chartData = data.length > 0 ? data : fallbackData;

  // Inside your component function, add these wrapper components:
  const BarChartWrapper = (props: any) => {
    const { BarChart } = require('recharts');
    return <BarChart {...props} />;
  };

  const BarWrapper = (props: any) => {
    const { Bar } = require('recharts');
    return <Bar {...props} />;
  };

  const CellWrapper = (props: any) => {
    const { Cell } = require('recharts');
    return <Cell {...props} />;
  };

  // Add missing wrappers
  const CartesianGridWrapper = (props: any) => {
    const { CartesianGrid } = require('recharts');
    return <CartesianGrid {...props} />;
  };

  const XAxisWrapper = (props: any) => {
    const { XAxis } = require('recharts');
    return <XAxis {...props} />;
  };

  const YAxisWrapper = (props: any) => {
    const { YAxis } = require('recharts');
    return <YAxis {...props} />;
  };

  const TooltipWrapper = (props: any) => {
    const { Tooltip } = require('recharts');
    return <Tooltip {...props} />;
  };

  const LegendWrapper = (props: any) => {
    const { Legend } = require('recharts');
    return <Legend {...props} />;
  };

  const ResponsiveContainerWrapper = (props: any) => {
    const { ResponsiveContainer } = require('recharts');
    return <ResponsiveContainer {...props} />;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainerWrapper width="100%" height={300}>
        <BarChartWrapper
          width={500}
          height={300}
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGridWrapper strokeDasharray="3 3" />
          <XAxisWrapper dataKey="priority" />
          <YAxisWrapper />
          <TooltipWrapper content={<CustomTooltip />} />
          <LegendWrapper />
          <BarWrapper dataKey="count" name="Number of Issues">
            {chartData.map((entry, index) => (
              <CellWrapper key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
            ))}
          </BarWrapper>
        </BarChartWrapper>
      </ResponsiveContainerWrapper>
    </div>
  );
};

export default IssuesByPriorityChart;