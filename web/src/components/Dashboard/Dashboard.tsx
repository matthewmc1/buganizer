import React, { useState, useEffect } from 'react';

// Define types for our data
interface AtRiskIssue {
  issueId: string;
  title: string;
  priority: string;
  severity: string;
  hoursRemaining: number;
  dueDate: string;
}

interface DashboardData {
  openIssues: number;
  slaBreaches: number;
  slaAtRisk: number;
  slaCompliance: number;
  atRiskIssues: AtRiskIssue[];
}

// Sample mock data for the dashboard
const sampleData: DashboardData = {
  openIssues: 12,
  slaBreaches: 2,
  slaAtRisk: 3,
  slaCompliance: 87.5,
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

// Simple Dashboard component without external dependencies
const SimpleDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setDashboardData(sampleData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || !dashboardData) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dashboard</h1>
        <div style={{ width: '100%', height: '0.5rem', backgroundColor: '#e6f2ff', borderRadius: '0.25rem' }}>
          <div 
            style={{ 
              width: '33%', 
              height: '100%', 
              backgroundColor: '#3b82f6', 
              borderRadius: '0.25rem',
              animation: 'pulse 1.5s infinite'
            }} 
          />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Dashboard</h1>
      
      {/* Summary Cards Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        {/* Open Issues Card */}
        <div style={{ 
          backgroundColor: '#e6f2ff', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#3b82f6', marginRight: '0.5rem' }}>📋</span>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>My Open Issues</h2>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {dashboardData.openIssues}
          </p>
          <button style={{ 
            color: '#3b82f6', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}>
            View All →
          </button>
        </div>
        
        {/* SLA Breaches Card */}
        <div style={{ 
          backgroundColor: '#fee2e2', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#ef4444', marginRight: '0.5rem' }}>🚨</span>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>SLA Breaches</h2>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {dashboardData.slaBreaches}
          </p>
          <button style={{ 
            color: '#ef4444', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}>
            Resolve Now →
          </button>
        </div>
        
        {/* At Risk Card */}
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#f59e0b', marginRight: '0.5rem' }}>⚠️</span>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>At Risk</h2>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {dashboardData.slaAtRisk}
          </p>
          <button style={{ 
            color: '#f59e0b', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}>
            View Issues →
          </button>
        </div>
        
        {/* SLA Compliance Card */}
        <div style={{ 
          backgroundColor: '#ecfdf5', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✅</span>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>SLA Compliance</h2>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {dashboardData.slaCompliance}%
          </p>
          <div style={{ 
            width: '100%', 
            height: '0.5rem', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '1rem',
            marginTop: '0.5rem'
          }}>
            <div 
              style={{ 
                width: `${dashboardData.slaCompliance}%`, 
                height: '100%', 
                backgroundColor: '#10b981', 
                borderRadius: '1rem' 
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* SLA Issues List */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '0.5rem', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #e5e7eb' 
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>SLA Breaches & At-Risk Issues</h2>
        </div>
        <div>
          {dashboardData.atRiskIssues.map((issue) => {
            const isBreached = issue.hoursRemaining <= 0;
            const statusBgColor = isBreached ? '#fee2e2' : '#fef3c7';
            const statusTextColor = isBreached ? '#ef4444' : '#f59e0b';
            const priorityBgColor = issue.priority === 'P0' ? '#fee2e2' : '#fef3c7';
            const priorityTextColor = issue.priority === 'P0' ? '#b91c1c' : '#b45309';
            const severityBgColor = issue.severity === 'S0' ? 'transparent' : 'transparent';
            const severityTextColor = issue.severity === 'S0' ? '#b91c1c' : '#b45309';
            const severityBorderColor = issue.severity === 'S0' ? '#fca5a5' : '#fcd34d';
            
            return (
              <div 
                key={issue.issueId}
                style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: isBreached ? '#fef2f2' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <h3 style={{ fontWeight: '500' }}>{issue.title}</h3>
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '9999px',
                        backgroundColor: statusBgColor,
                        color: statusTextColor
                      }}>
                        {isBreached ? "SLA Breached" : "SLA At Risk"}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      marginTop: '0.25rem', 
                      fontSize: '0.875rem', 
                      color: '#4b5563' 
                    }}>
                      <span style={{ 
                        marginRight: '0.5rem', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '0.25rem',
                        backgroundColor: priorityBgColor,
                        color: priorityTextColor
                      }}>
                        {issue.priority}
                      </span>
                      <span style={{ 
                        marginRight: '0.5rem', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '0.25rem',
                        backgroundColor: severityBgColor,
                        color: severityTextColor,
                        border: `1px solid ${severityBorderColor}`
                      }}>
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
                  <button style={{ 
                    color: '#3b82f6',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '1.25rem',
                    cursor: 'pointer'
                  }}>
                    →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Basic Charts Section - Simplified without external dependencies */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        {/* Basic Component Distribution */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ 
            padding: '1rem', 
            borderBottom: '1px solid #e5e7eb' 
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Issues By Component</h2>
          </div>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Simple Component Breakdown:</p>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Frontend</span>
                <div style={{ 
                  width: '60%', 
                  height: '1rem', 
                  backgroundColor: '#3b82f6', 
                  borderRadius: '0.25rem' 
                }} />
                <span>40%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Backend</span>
                <div style={{ 
                  width: '45%', 
                  height: '1rem', 
                  backgroundColor: '#10b981', 
                  borderRadius: '0.25rem' 
                }} />
                <span>30%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Database</span>
                <div style={{ 
                  width: '30%', 
                  height: '1rem', 
                  backgroundColor: '#f59e0b', 
                  borderRadius: '0.25rem' 
                }} />
                <span>20%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Auth</span>
                <div style={{ 
                  width: '15%', 
                  height: '1rem', 
                  backgroundColor: '#ef4444', 
                  borderRadius: '0.25rem' 
                }} />
                <span>10%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Basic Priority Distribution */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ 
            padding: '1rem', 
            borderBottom: '1px solid #e5e7eb' 
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Issues By Priority</h2>
          </div>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Priority Distribution:</p>
            <div style={{ 
              display: 'flex', 
              height: '200px', 
              padding: '0 2rem',
              alignItems: 'flex-end',
              justifyContent: 'space-around'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '40px', 
                  backgroundColor: '#ef4444', 
                  borderRadius: '0.25rem 0.25rem 0 0' 
                }} />
                <span style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>P0</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '70px', 
                  backgroundColor: '#f59e0b', 
                  borderRadius: '0.25rem 0.25rem 0 0' 
                }} />
                <span style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>P1</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '120px', 
                  backgroundColor: '#3b82f6', 
                  borderRadius: '0.25rem 0.25rem 0 0' 
                }} />
                <span style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>P2</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '160px', 
                  backgroundColor: '#10b981', 
                  borderRadius: '0.25rem 0.25rem 0 0' 
                }} />
                <span style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>P3</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '60px', 
                  backgroundColor: '#6b7280', 
                  borderRadius: '0.25rem 0.25rem 0 0' 
                }} />
                <span style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>P4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simplified SLA Compliance Trend */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '0.5rem', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #e5e7eb' 
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>SLA Compliance Trend</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          <p style={{ color: '#6b7280', marginBottom: '1rem', textAlign: 'center' }}>
            Recent compliance trend showing improvement over time
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            height: '200px',
            padding: '0 2rem',
            borderBottom: '1px solid #e5e7eb',
            borderLeft: '1px solid #e5e7eb',
            position: 'relative'
          }}>
            {/* Target line */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '10%',
              borderTop: '2px dashed #10b981',
              zIndex: 1
            }}>
              <span style={{ 
                position: 'absolute', 
                right: 0, 
                top: -20, 
                fontSize: '0.75rem',
                color: '#10b981',
                fontWeight: 'bold'
              }}>
                Target (90%)
              </span>
            </div>
            
            {/* Trend line points */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              width: '100%',
              height: '100%',
              position: 'relative'
            }}>
              {[82, 84, 86, 85, 88, 87.5].map((value, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    width: '40px'
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    marginBottom: '4px',
                    zIndex: 2,
                    position: 'relative',
                    bottom: `${value}%`
                  }} />
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    position: 'absolute',
                    bottom: '-25px'
                  }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: '#3b82f6',
                marginRight: '0.5rem'
              }} />
              <span style={{ fontSize: '0.875rem' }}>SLA Compliance (%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '12px', 
                height: '2px', 
                backgroundColor: '#10b981', 
                marginRight: '0.5rem',
                borderBottom: '2px dashed #10b981'
              }} />
              <span style={{ fontSize: '0.875rem' }}>Target (90%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;