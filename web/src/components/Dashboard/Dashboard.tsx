import React, { useState, useEffect } from 'react';
import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer as RechartsResponsiveContainer
} from 'recharts';
// Import components at the top level
import IssuesByComponentChart from './IssuesByComponentChart';
import IssuesByPriorityChart from './IssuesByPriorityChart';

// Sample mock data for the dashboard
const sampleData = {
  openIssues: 12,
  slaBreaches: 2,
  slaAtRisk: 3,
  slaCompliance: 87.5,
  complianceTrend: [
    { month: 'Jan', value: 82 },
    { month: 'Feb', value: 84 },
    { month: 'Mar', value: 86 },
    { month: 'Apr', value: 85 },
    { month: 'May', value: 88 },
    { month: 'Jun', value: 87.5 }
  ],
  issuesByComponent: [
    { name: 'Frontend', value: 12, color: '#3b82f6' },
    { name: 'Backend API', value: 8, color: '#10b981' },
    { name: 'Database', value: 5, color: '#f59e0b' },
    { name: 'Authentication', value: 3, color: '#ef4444' },
    { name: 'Infrastructure', value: 4, color: '#8b5cf6' },
  ],
  issuesByPriority: [
    { priority: 'P0', count: 2, color: '#ef4444' },  // Critical - red
    { priority: 'P1', count: 5, color: '#f59e0b' },  // High - amber
    { priority: 'P2', count: 8, color: '#3b82f6' },  // Medium - blue
    { priority: 'P3', count: 12, color: '#10b981' }, // Low - green
    { priority: 'P4', count: 3, color: '#6b7280' },  // Trivial - gray
  ],
  atRiskIssues: [
    {
      issueId: 'ISSUE-123',
      title: 'API Authentication Failure',
      priority: 'P0',
      severity: 'S0',
      hoursRemaining: -2.5, // negative means breached
      dueDate: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
      issueId: 'ISSUE-145',
      title: 'Database Connection Timeout',
      priority: 'P1',
      severity: 'S1',
      hoursRemaining: -0.5,
      dueDate: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString()
    },
    {
      issueId: 'ISSUE-156',
      title: 'Frontend Components Not Loading',
      priority: 'P1',
      severity: 'S2',
      hoursRemaining: 3.2,
      dueDate: new Date(Date.now() + 3.2 * 60 * 60 * 1000).toISOString()
    },
    {
      issueId: 'ISSUE-158',
      title: 'Payment Processing Error',
      priority: 'P2',
      severity: 'S1',
      hoursRemaining: 5.7,
      dueDate: new Date(Date.now() + 5.7 * 60 * 60 * 1000).toISOString()
    },
    {
      issueId: 'ISSUE-160',
      title: 'User Session Expiration Bug',
      priority: 'P2',
      severity: 'S2',
      hoursRemaining: 7.5,
      dueDate: new Date(Date.now() + 7.5 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// Define the type for dashboard data
interface DashboardData {
  openIssues: number;
  slaBreaches: number;
  slaAtRisk: number;
  slaCompliance: number;
  complianceTrend: { month: string; value: number }[];
  issuesByComponent: { name: string; value: number; color: string }[];
  issuesByPriority: { priority: string; count: number; color: string }[];
  atRiskIssues: {
    issueId: string;
    title: string;
    priority: string;
    severity: string;
    hoursRemaining: number;
    dueDate: string;
  }[];
}

// Create wrapper components for Recharts
const LineChartWrapper = (props: any) => {
  const { LineChart } = require('recharts');
  return <LineChart {...props} />;
};

const LineWrapper = (props: any) => {
  const { Line } = require('recharts');
  return <Line {...props} />;
};

const XAxisWrapper = (props: any) => {
  const { XAxis } = require('recharts');
  return <XAxis {...props} />;
};

const YAxisWrapper = (props: any) => {
  const { YAxis } = require('recharts');
  return <YAxis {...props} />;
};

const CartesianGridWrapper = (props: any) => {
  const { CartesianGrid } = require('recharts');
  return <CartesianGrid {...props} />;
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

// Dashboard component
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Simulate data loading on component mount
  useEffect(() => {
    // Simulate API call with setTimeout
    const timer = setTimeout(() => {
      setDashboardData(sampleData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer); // Clean up on unmount
  }, []);

  // Show loading state if data is not yet loaded
  if (loading || !dashboardData) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="w-full h-2 bg-blue-100 rounded">
          <div className="w-1/3 h-full bg-blue-500 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Open Issues Card */}
        <div className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-lg transition-all">
          <div className="flex items-center mb-2">
            <span className="text-blue-500 mr-2">📋</span>
            <h2 className="text-lg font-semibold">My Open Issues</h2>
          </div>
          <p className="text-3xl font-bold mb-2">{dashboardData.openIssues}</p>
          <button className="text-blue-500 text-sm font-medium">
            View All →
          </button>
        </div>
        
        {/* SLA Breaches Card */}
        <div className="bg-red-50 p-4 rounded-lg shadow hover:shadow-lg transition-all">
          <div className="flex items-center mb-2">
            <span className="text-red-500 mr-2">🚨</span>
            <h2 className="text-lg font-semibold">SLA Breaches</h2>
          </div>
          <p className="text-3xl font-bold mb-2">{dashboardData.slaBreaches}</p>
          <button className="text-red-500 text-sm font-medium">
            Resolve Now →
          </button>
        </div>
        
        {/* At Risk Card */}
        <div className="bg-yellow-50 p-4 rounded-lg shadow hover:shadow-lg transition-all">
          <div className="flex items-center mb-2">
            <span className="text-yellow-500 mr-2">⚠️</span>
            <h2 className="text-lg font-semibold">At Risk</h2>
          </div>
          <p className="text-3xl font-bold mb-2">{dashboardData.slaAtRisk}</p>
          <button className="text-yellow-500 text-sm font-medium">
            View Issues →
          </button>
        </div>
        
        {/* SLA Compliance Card */}
        <div className="bg-green-50 p-4 rounded-lg shadow hover:shadow-lg transition-all">
          <div className="flex items-center mb-2">
            <span className="text-green-500 mr-2">✅</span>
            <h2 className="text-lg font-semibold">SLA Compliance</h2>
          </div>
          <p className="text-3xl font-bold mb-2">{dashboardData.slaCompliance}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${dashboardData.slaCompliance}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* SLA Issues List */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">SLA Breaches & At-Risk Issues</h2>
        </div>
        <div className="divide-y">
          {dashboardData.atRiskIssues.map((issue) => {
            const isBreached = issue.hoursRemaining <= 0;
            const statusColor = isBreached ? 'text-red-500 bg-red-50' : 'text-yellow-500 bg-yellow-50';
            
            return (
              <div 
                key={issue.issueId}
                className={`p-4 hover:bg-gray-50 ${isBreached ? 'bg-red-50' : ''}`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">{issue.title}</h3>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${statusColor}`}>
                        {isBreached ? "SLA Breached" : "SLA At Risk"}
                      </span>
                    </div>
                    <div className="flex mt-1 text-sm text-gray-600">
                      <span className={`mr-2 px-2 py-0.5 rounded ${issue.priority === 'P0' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {issue.priority}
                      </span>
                      <span className={`mr-2 px-2 py-0.5 rounded border ${issue.severity === 'S0' ? 'border-red-300 text-red-800' : 'border-yellow-300 text-yellow-800'}`}>
                        {issue.severity}
                      </span>
                      <span>
                        {isBreached
                          ? `Breached ${Math.abs(issue.hoursRemaining).toFixed(1)} hours ago`
                          : `Due in ${issue.hoursRemaining.toFixed(1)} hours`
                        }
                      </span>
                    </div>
                  </div>
                  <button className="text-blue-500">→</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Issues By Component Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Issues By Component</h2>
          </div>
          <div className="p-4">
            <IssuesByComponentChart data={dashboardData.issuesByComponent} />
          </div>
        </div>
        
        {/* Issues By Priority Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Issues By Priority</h2>
          </div>
          <div className="p-4">
            <IssuesByPriorityChart data={dashboardData.issuesByPriority} />
          </div>
        </div>
      </div>
      
      {/* SLA Compliance Trend Chart */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">SLA Compliance Trend</h2>
        </div>
        <div className="p-4" style={{ height: "300px" }}>
          <ResponsiveContainerWrapper width="100%" height="100%">
            <LineChartWrapper
              width={500}
              height={300}
              data={dashboardData.complianceTrend}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGridWrapper strokeDasharray="3 3" />
              <XAxisWrapper dataKey="month" />
              <YAxisWrapper domain={[75, 95]} />
              <TooltipWrapper />
              <LegendWrapper />
              <LineWrapper 
                type="monotone" 
                dataKey="value" 
                name="SLA Compliance (%)"
                stroke="#3b82f6" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
              <LineWrapper 
                type="monotone" 
                dataKey={() => 90} 
                stroke="#10b981" 
                strokeDasharray="5 5" 
                name="Target (90%)"
                strokeWidth={2}
              />
            </LineChartWrapper>
          </ResponsiveContainerWrapper>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;