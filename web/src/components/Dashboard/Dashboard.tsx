import React, { useState, useEffect, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Chip,
  Button, 
  CircularProgress,
  Divider,
  LinearProgress,
  IconButton,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Stack
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  BugReport as BugReportIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useSLA } from '../../hooks/useSLA';
import { useIssues } from '../../hooks/useIssues';
import { useAssignments } from '../../hooks/useAssignments';
import PriorityChip from '../PriorityChip/PriorityChip';
import IssueStatusChip from '../IssueStatusChip/IssueStatusChip';
import { Link, useNavigate } from 'react-router-dom';

// Define types for the dashboard data
interface DashboardMetrics {
  currentComplianceRate: number;
  complianceTrend: Array<{ date: string; value: number }>;
  atRiskCount: number;
  breachedThisWeek: number;
  averageResolutionTime: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
    P4: number;
  };
}

// Simple Chart component props
interface SimpleChartProps {
  data: number[];
  color: string;
}

// Simple Chart component using divs
const SimpleChart: React.FC<SimpleChartProps> = ({ data, color }) => {
  const max = Math.max(...data);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 40, gap: 0.5 }}>
      {data.map((value: number, i: number) => (
        <Box 
          key={i} 
          sx={{ 
            width: '8px', 
            height: `${(value / max) * 100}%`, 
            backgroundColor: color,
            borderRadius: '2px',
            transition: 'height 0.3s ease'
          }}
        />
      ))}
    </Box>
  );
};

// MetricCard props interface
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  icon: ReactNode;
  color: string;
  onClick?: () => void;
  children?: ReactNode;
}

// Card with header and action
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'up', 
  icon, 
  color, 
  onClick, 
  children 
}) => {
  const theme = useTheme();
  const isPositive = changeType === 'up';
  const changeColor = isPositive ? theme.palette.success.main : theme.palette.error.main;
  
  return (
    <Card 
      elevation={0} 
      sx={{ 
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2, 
        p: 0,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: alpha(color, 0.1),
              color: color
            }}>
              {icon}
            </Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
          </Box>
          {onClick && (
            <IconButton size="small" onClick={onClick}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {value}
          </Typography>
          
          {change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isPositive ? 
                <TrendingUpIcon sx={{ color: changeColor, fontSize: 16 }} /> : 
                <TrendingDownIcon sx={{ color: changeColor, fontSize: 16 }} />
              }
              <Typography variant="caption" fontWeight={500} sx={{ color: changeColor }}>
                {change}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Box sx={{ flexGrow: 1, mt: 1 }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

const ModernDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  
  const { getDashboardMetrics } = useSLA();
  const { issues } = useIssues({ initialFilter: 'assignee:me status:open' });
  const { assignments } = useAssignments();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const metrics = await getDashboardMetrics();
        setDashboardData(metrics as DashboardMetrics);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getDashboardMetrics]);

  // Define type for SLA at risk issues
  interface AtRiskIssue {
    id: string;
    title: string;
    priority: string;
    severity: string;
    hoursRemaining: number;
    status: string;
  }
  
  // Sample SLA at risk issues
  const atRiskIssues: AtRiskIssue[] = [
    {
      id: 'ISSUE-123',
      title: 'API Authentication Failure',
      priority: 'P0',
      severity: 'S0',
      hoursRemaining: -2.5,
      status: 'IN_PROGRESS'
    },
    {
      id: 'ISSUE-145',
      title: 'Database Connection Timeout',
      priority: 'P1',
      severity: 'S1',
      hoursRemaining: 1.5,
      status: 'ASSIGNED'
    },
    {
      id: 'ISSUE-156',
      title: 'Frontend Components Not Loading',
      priority: 'P1',
      severity: 'S2',
      hoursRemaining: 3.2,
      status: 'IN_PROGRESS'
    }
  ];
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Dashboard</Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's an overview of your bug tracking activity.
        </Typography>
      </Box>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Open Issues"
            value={issues.length}
            change="+5% from last week"
            icon={<BugReportIcon />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/issues?filter=status:open')}
          >
            <SimpleChart 
              data={[8, 12, 10, 14, 15, 18, 20]} 
              color={theme.palette.primary.main} 
            />
          </MetricCard>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="SLA Compliance"
            value={`${dashboardData?.currentComplianceRate || 87}%`}
            change="↑ 2.5% this month"
            changeType="up"
            icon={<CheckCircleIcon />}
            color={theme.palette.success.main}
            onClick={() => navigate('/reports/sla')}
          >
            <SimpleChart 
              data={dashboardData?.complianceTrend?.map((d) => d.value) || [82, 84, 86, 85, 87, 89]} 
              color={theme.palette.success.main} 
            />
          </MetricCard>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="At Risk"
            value={dashboardData?.atRiskCount || 3}
            change="↓ 2 from yesterday"
            changeType="down"
            icon={<WarningIcon />}
            color={theme.palette.warning.main}
            onClick={() => navigate('/issues?filter=sla:atrisk')}
          >
            <Box sx={{ mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={30} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: alpha(theme.palette.warning.main, 0.2),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.warning.main
                  }
                }} 
              />
            </Box>
          </MetricCard>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Avg. Resolution Time"
            value="18.5h"
            change="↓ 2.3h this month"
            changeType="down"
            icon={<AccessTimeIcon />}
            color={theme.palette.info.main}
            onClick={() => navigate('/reports/resolution-time')}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 1
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary">P0</Typography>
                <Typography variant="body2" fontWeight={600}>3.2h</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">P1</Typography>
                <Typography variant="body2" fontWeight={600}>18.5h</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">P2</Typography>
                <Typography variant="body2" fontWeight={600}>65.3h</Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>
      </Grid>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card 
            elevation={0} 
            sx={{ 
              mb: 3, 
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ 
              px: 3, 
              py: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              <Typography variant="h6" fontWeight={600}>SLA At Risk</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />} 
                component={Link}
                to="/issues?filter=sla:atrisk"
                sx={{ textTransform: 'none' }}
              >
                View All
              </Button>
            </Box>
            
            <Box>
              {atRiskIssues.map((issue, index) => (
                <Box 
                  key={issue.id}
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: index < atRiskIssues.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {issue.title}
                      </Typography>
                      <Chip 
                        label={issue.id} 
                        size="small" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 600,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }} 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1,
                        backgroundColor: issue.hoursRemaining < 0 
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.warning.main, 0.1),
                        color: issue.hoursRemaining < 0
                          ? theme.palette.error.main
                          : theme.palette.warning.main
                      }}>
                        <Typography variant="caption" fontWeight={600}>
                          {issue.hoursRemaining < 0 
                            ? `Breached ${Math.abs(issue.hoursRemaining).toFixed(1)}h ago` 
                            : `Due in ${issue.hoursRemaining.toFixed(1)}h`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <PriorityChip priority={issue.priority} />
                    <IssueStatusChip status={issue.status} />
                  </Box>
                </Box>
              ))}
              
              {atRiskIssues.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No issues at risk. Great job!
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
          
          <Card 
            elevation={0} 
            sx={{ 
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ 
              px: 3, 
              py: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              <Typography variant="h6" fontWeight={600}>Recent Activity</Typography>
            </Box>
            
            <List sx={{ py: 0 }}>
              {issues.slice(0, 5).map((issue, index) => (
                <ListItem 
                  key={issue.id}
                  divider={index < 4}
                  sx={{ 
                    px: 3, 
                    py: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                >
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mr: 2
                  }}>
                    <BugReportIcon />
                  </Avatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {issue.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <PriorityChip priority={issue.priority} />
                        <IssueStatusChip status={issue.status} />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card 
            elevation={0} 
            sx={{ 
              mb: 3,
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ 
              px: 3, 
              py: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              <Typography variant="h6" fontWeight={600}>Priority Distribution</Typography>
            </Box>
            
            <Box sx={{ p: 3 }}>
              {['P0', 'P1', 'P2', 'P3'].map((priority, index) => {
                const count = issues.filter(issue => issue.priority === priority).length;
                const percent = issues.length > 0 ? (count / issues.length) * 100 : 0;
                
                let color;
                switch(priority) {
                  case 'P0': color = theme.palette.error.main; break;
                  case 'P1': color = theme.palette.warning.main; break;
                  case 'P2': color = theme.palette.info.main; break;
                  default: color = theme.palette.success.main;
                }
                
                return (
                  <Box key={priority} sx={{ mb: index < 3 ? 2 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {priority}
                      </Typography>
                      <Typography variant="body2">
                        {count} ({percent.toFixed(0)}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={percent} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: alpha(color, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: color
                        }
                      }} 
                    />
                  </Box>
                );
              })}
            </Box>
          </Card>
          
          <Card 
            elevation={0} 
            sx={{ 
              mb: 3,
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ 
              px: 3, 
              py: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              <Typography variant="h6" fontWeight={600}>Active Assignments</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />} 
                component={Link}
                to="/assignments"
                sx={{ textTransform: 'none' }}
              >
                View All
              </Button>
            </Box>
            
            <Stack spacing={0} divider={<Divider />}>
              {assignments.slice(0, 3).map((assignment) => (
                <Box 
                  key={assignment.id}
                  sx={{ 
                    p: 2, 
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.primary.main, 0.04), 
                      cursor: 'pointer' 
                    }
                  }}
                  onClick={() => navigate(`/assignments/${assignment.id}`)}
                >
                  <Typography variant="subtitle2" noWrap gutterBottom>
                    {assignment.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={assignment.status} 
                      size="small" 
                      color={
                        assignment.status === 'COMPLETED' ? 'success' :
                        assignment.status === 'IN_PROGRESS' ? 'primary' :
                        assignment.status === 'PLANNING' ? 'info' : 'default'
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      {assignment.componentIds?.length || 0} components
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {assignments.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No active assignments
                  </Typography>
                </Box>
              )}
            </Stack>
          </Card>
          
          <Card 
            elevation={0} 
            sx={{ 
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>Need Help?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Check out our comprehensive documentation for guides on using the issue tracker effectively.
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  View Documentation
                </Button>
                <Button 
                  variant="contained" 
                  fullWidth
                >
                  Contact Support
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModernDashboard;