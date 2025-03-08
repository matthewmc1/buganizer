import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Fallback data in case no data is provided
const fallbackData = [
  { name: 'No Data', value: 1, color: '#d1d5db' }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: any;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
        <p className="font-medium">{`${payload[0].name}: ${payload[0].value} issues`}</p>
      </div>
    );
  }
  return null;
};

interface ComponentData {
  name: string;
  value: number;
  color: string;
}

interface IssuesByComponentChartProps {
  data: ComponentData[];
}

interface LabelProps {
  name: string;
  percent: number;
}

const IssuesByComponentChart: React.FC<IssuesByComponentChartProps> = ({ data = [] }) => {
  // Use provided data or fallback if empty
  const chartData = data.length > 0 ? data : fallbackData;

  // Create wrapper components for Recharts
  const PieChartWrapper = (props: any) => {
    const { PieChart } = require('recharts');
    return <PieChart {...props} />;
  };

  const PieWrapper = (props: any) => {
    const { Pie } = require('recharts');
    return <Pie {...props} />;
  };

  const CellWrapper = (props: any) => {
    const { Cell } = require('recharts');
    return <Cell {...props} />;
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
        <PieChartWrapper width={400} height={300}>
          <PieWrapper
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: LabelProps) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <CellWrapper 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]} 
              />
            ))}
          </PieWrapper>
          <TooltipWrapper content={<CustomTooltip />} />
          <LegendWrapper />
        </PieChartWrapper>
      </ResponsiveContainerWrapper>
    </div>
  );
};

export default IssuesByComponentChart;