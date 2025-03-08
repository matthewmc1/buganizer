// src/components/AssignmentDetail/AssignmentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Divider, 
  Chip, 
  IconButton, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  LinearProgress, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Tooltip,
  Alert,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  BugReport as BugReportIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

import { useAssignments } from '../../hooks/useAssignments';
import { Assignment, AssignmentStatus } from '../../types/assignments';
import { Priority, Severity, Status, Issue } from '../../types/issues';
import { Team } from '../../types/users';
import IssueStatusChip from '../IssueStatusChip/IssueStatusChip';
import PriorityChip from '../PriorityChip/PriorityChip';
import SeverityChip from '../SeverityChip/SeverityChip';
import { useSLA } from '../../hooks/useSLA';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assignment-tabpanel-${index}`}
      aria-labelledby={`assignment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { getSLAStats } = useSLA();
  
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [slaStats, setSLAStats] = useState<any>(null);
  const [slaLoading, setSLALoading] = useState(false);
  
  const { 
    assignment, 
    loading, 
    error, 
    fetchAssignmentById, 
    deleteAssignment,
    assignmentIssues,
    loadingIssues,
    fetchAssignmentIssues
  } = useAssignments(id);
  
  useEffect(() => {
    if (id) {
      fetchAssignmentById(id);
      fetchAssignmentIssues(id);
    }
  }, [id, fetchAssignmentById, fetchAssignmentIssues]);

  useEffect(() => {
    // Fetch SLA stats for this assignment when assignment is loaded
    const fetchSLAStats = async () => {
      if (!assignment) return;
      
      setSLALoading(true);
      try {
        const stats = await getSLAStats({
          teamId: assignment.teamId
        });
        setSLAStats(stats);
      } catch (error) {
        console.error('Error fetching SLA stats:', error);
      } finally {
        setSLALoading(false);
      }
    };
    
    fetchSLAStats();
  }, [assignment, getSLAStats]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await deleteAssignment(id);
      setDeleteDialogOpen(false);
      navigate('/assignments');
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchorEl(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };

  const handleAddIssueClick = () => {
    navigate('/issues/new', { 
      state: { 
        assignmentId: id,
        preSelectedComponents: assignment?.componentIds
      } 
    });
  };

  // Get status color
  const getStatusColor = (status: AssignmentStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case AssignmentStatus.PLANNING:
        return 'info';
      case AssignmentStatus.IN_PROGRESS:
        return 'primary';
      case AssignmentStatus.TESTING:
        return 'warning';
      case AssignmentStatus.COMPLETED:
        return 'success';
      case AssignmentStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !assignment) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading assignment: {error || 'Assignment not found'}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/assignments')}
          sx={{ mt: 2 }}
        >
          Back to Assignments
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} color="inherit" to="/">
            Home
          </Link>
          <Link component={RouterLink} color="inherit" to="/assignments">
            Assignments
          </Link>
          <Typography color="textPrimary">Assignment {assignment.id.slice(0, 8)}</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/assignments')}
          >
            Back to Assignments
          </Button>
          
          <Box>
            <Button 
              startIcon={<EditIcon />} 
              component={RouterLink}
              to={`/assignments/${id}/edit`}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleDeleteOpen}
            >
              Delete
            </Button>
          </Box>
        </Box>
        
        <Divider />
        
        {/* Header Section */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                {assignment.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                  ID: {assignment.id.slice(0, 8)}
                </Typography>
                <Chip 
                  label={assignment.status} 
                  color={getStatusColor(assignment.status as AssignmentStatus)}
                  size="small"
                  sx={{ ml: 1 }}
                />
                <PriorityChip priority={assignment.priority} />
              </Box>
            </Box>
            
            <IconButton onClick={handleMoreMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={moreMenuAnchorEl}
              open={Boolean(moreMenuAnchorEl)}
              onClose={handleMoreMenuClose}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 200, borderRadius: 2 }
              }}
            >
              <MenuItem onClick={handleAddIssueClick}>
                <ListItemIcon>
                  <AddCircleOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Add Issue" />
              </MenuItem>
              <MenuItem 
                component={RouterLink} 
                to={`/assignments/${id}/edit`}
                onClick={handleMoreMenuClose}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Edit Assignment" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDeleteOpen}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Delete Assignment" sx={{ color: theme.palette.error.main }} />
              </MenuItem>
            </Menu>
          </Box>
          
          {/* Basic Information */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    {assignment.description || "No description provided."}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Ownership
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Team: <strong>{assignment.teamId}</strong> {/* In real app, show team name */}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Lead: <strong>{assignment.leadId}</strong> {/* In real app, show user name */}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Timeline
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Start Date: <strong>{format(new Date(assignment.startDate), 'MMM d, yyyy')}</strong>
                      </Typography>
                    </Box>
                    {assignment.targetDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Target Date: <strong>{format(new Date(assignment.targetDate), 'MMM d, yyyy')}</strong>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Statistics
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Issues:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {assignmentIssues.length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Open Issues:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {assignmentIssues.filter(issue => issue.status !== 'CLOSED').length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Components:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {assignment.componentIds ? assignment.componentIds.length : 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Customers:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {assignment.customerId ? assignment.customerId.length : 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Assignment Progress */}
          <Box sx={{ mt: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Assignment Progress
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper
                  variant="outlined"
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderColor: theme.palette.success.main
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Issue Completion
                    </Typography>
                    <Chip 
                      label={`${assignmentIssues.filter(issue => issue.status === 'CLOSED').length} / ${assignmentIssues.length} Issues`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={assignmentIssues.length > 0 
                        ? (assignmentIssues.filter(issue => issue.status === 'CLOSED').length / assignmentIssues.length) * 100
                        : 0
                      } 
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} md={3}>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          textAlign: 'center',
                          bgcolor: theme.palette.info.light,
                          color: theme.palette.info.contrastText
                        }}
                      >
                        <Typography variant="h6">
                          {assignmentIssues.filter(issue => issue.status === 'NEW').length}
                        </Typography>
                        <Typography variant="caption">New</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          textAlign: 'center',
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText
                        }}
                      >
                        <Typography variant="h6">
                          {assignmentIssues.filter(issue => 
                            issue.status === 'IN_PROGRESS' || issue.status === 'ASSIGNED'
                          ).length}
                        </Typography>
                        <Typography variant="caption">In Progress</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          textAlign: 'center',
                          bgcolor: theme.palette.warning.light,
                          color: theme.palette.warning.contrastText
                        }}
                      >
                        <Typography variant="h6">
                          {assignmentIssues.filter(issue => 
                            issue.status === 'FIXED' || issue.status === 'VERIFIED'
                          ).length}
                        </Typography>
                        <Typography variant="caption">Fixed</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          textAlign: 'center',
                          bgcolor: theme.palette.success.light,
                          color: theme.palette.success.contrastText
                        }}
                      >
                        <Typography variant="h6">
                          {assignmentIssues.filter(issue => issue.status === 'CLOSED').length}
                        </Typography>
                        <Typography variant="caption">Closed</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{ 
                    p: 2, 
                    bgcolor: slaLoading ? undefined : (
                      slaStats && slaStats.slaCompliancePercentage >= 90 
                      ? alpha(theme.palette.success.main, 0.05)
                      : slaStats && slaStats.slaCompliancePercentage >= 80
                      ? alpha(theme.palette.warning.main, 0.05)
                      : alpha(theme.palette.error.main, 0.05)
                    ),
                    borderColor: slaLoading ? undefined : (
                      slaStats && slaStats.slaCompliancePercentage >= 90
                      ? theme.palette.success.main
                      : slaStats && slaStats.slaCompliancePercentage >= 80
                      ? theme.palette.warning.main
                      : theme.palette.error.main
                    ),
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    SLA Compliance
                  </Typography>
                  
                  {slaLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : slaStats ? (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h3" component="div" fontWeight="bold" color={
                        slaStats.slaCompliancePercentage >= 90
                        ? 'success.main'
                        : slaStats.slaCompliancePercentage >= 80
                        ? 'warning.main'
                        : 'error.main'
                      }>
                        {slaStats.slaCompliancePercentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {slaStats.metSla} / {slaStats.totalIssues} issues within SLA
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                        <Chip
                          label={`${slaStats.issuesByPriority?.P0 || 0} P0`}
                          size="small"
                          color="error"
                        />
                        <Chip
                          label={`${slaStats.issuesByPriority?.P1 || 0} P1`}
                          size="small"
                          color="warning"
                        />
                        <Chip
                          label={`${slaStats.issuesByPriority?.P2 || 0} P2`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                      No SLA data available
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
      
      {/* Tabs Section */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="assignment tabs"
          >
            <Tab label="Issues" id="assignment-tab-0" icon={<BugReportIcon />} iconPosition="start" />
            <Tab label="Components" id="assignment-tab-1" icon={<CodeIcon />} iconPosition="start" />
            <Tab label="Customers" id="assignment-tab-2" icon={<BusinessIcon />} iconPosition="start" />
            <Tab label="Timeline" id="assignment-tab-3" icon={<TimelineIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Issues Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Related Issues</Typography>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddIssueClick}
            >
              Add Issue
            </Button>
          </Box>
          
          {loadingIssues ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : assignmentIssues.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Priority</TableCell>
                    <TableCell align="center">Severity</TableCell>
                    <TableCell>Assignee</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentIssues.map((issue) => (
                    <TableRow 
                      key={issue.id}
                      hover
                      component={RouterLink}
                      to={`/issues/${issue.id}`}
                      sx={{ 
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell>{issue.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium" 
                          color="primary.main"
                          sx={{ 
                            maxWidth: 300, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {issue.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IssueStatusChip status={issue.status} />
                      </TableCell>
                      <TableCell align="center">
                        <PriorityChip priority={issue.priority} />
                      </TableCell>
                      <TableCell align="center">
                        <SeverityChip severity={issue.severity} />
                      </TableCell>
                      <TableCell>
                        {issue.assigneeId ? issue.assigneeId : "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {issue.dueDate ? (
                          <Tooltip title={format(new Date(issue.dueDate), 'PPpp')}>
                            <Typography 
                              variant="body2" 
                              color={new Date(issue.dueDate) < new Date() ? 'error.main' : 'text.primary'}
                            >
                              {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true })}
                            </Typography>
                          </Tooltip>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No issues have been created for this assignment yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddIssueClick}
                sx={{ mt: 2 }}
              >
                Create First Issue
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Components Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Components</Typography>
          
          {assignment.componentIds && assignment.componentIds.length > 0 ? (
            <Grid container spacing={2}>
              {assignment.componentIds.map((componentId, index) => (
                <Grid item xs={12} sm={6} md={4} key={componentId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {componentId} {/* In real app, show component name */}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Component Description {/* In real app, show component description */}
                      </Typography>
                      
                      <Box sx={{ 
                        bgcolor: 'background.default', 
                        p: 1.5, 
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="caption" fontWeight="medium">SLA Configuration</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>P0 Response:</span> <strong>1 hour</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>P0 Resolution:</span> <strong>8 hours</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>P1 Response:</span> <strong>4 hours</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>P1 Resolution:</span> <strong>24 hours</strong>
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No components assigned to this assignment.
            </Typography>
          )}
        </TabPanel>
        
        {/* Customers Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Impacted Customers</Typography>
          
          {assignment.customerId && assignment.customerId.length > 0 ? (
            <Grid container spacing={2}>
              {assignment.customerId.map((customerId, index) => (
                <Grid item xs={12} sm={6} key={customerId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {customerId} {/* In real app, show customer name */}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Customer Company {/* In real app, show company name */}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 1.5 }} />
                      
                      <Box>
                        <Typography variant="body2" gutterBottom fontWeight="medium">
                          Impact:
                        </Typography>
                        <Chip
                          label="Feature Enhancement"
                          size="small"
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                          {/* In real app, show customer notes */}
                          This customer has requested this functionality to improve their workflow efficiency.
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No customers associated with this assignment.
            </Typography>
          )}
        </TabPanel>
        
        {/* Timeline Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Assignment Timeline</Typography>
          
          <Box sx={{ position: 'relative', ml: 2, mt: 2 }}>
            {/* Timeline line */}
            <Box sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: 'divider',
              zIndex: 0,
            }} />
            
            {/* Timeline events */}
            <List sx={{ py: 0 }}>
              <ListItem sx={{ pb: 3 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, zIndex: 1 }}>
                    <CheckCircleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      Assignment Created
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(assignment.createdAt), 'MMMM d, yyyy')}
                    </Typography>
                  }
                />
              </ListItem>
              
              <ListItem sx={{ pb: 3 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, zIndex: 1 }}>
                    <ScheduleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      Started Work
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(assignment.startDate), 'MMMM d, yyyy')}
                    </Typography>
                  }
                />
              </ListItem>
              
              {assignment.targetDate && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: new Date(assignment.targetDate) < new Date() 
                      ? theme.palette.error.main 
                      : theme.palette.warning.main, zIndex: 1 }}>
                      <ScheduleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        Target Completion
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(assignment.targetDate), 'MMMM d, yyyy')}
                        {' '}
                        ({formatDistanceToNow(new Date(assignment.targetDate), { addSuffix: true })})
                      </Typography>
                    }
                  />
                </ListItem>
              )}
              
              {assignment.status === AssignmentStatus.COMPLETED && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.success.main, zIndex: 1 }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        Completed
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(assignment.updatedAt), 'MMMM d, yyyy')}
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
      >
        <DialogTitle>Delete Assignment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this assignment? This will not delete the associated issues, but they will no longer be linked to this assignment.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>
            Cancel
          </Button>
          <Button 
            color="error" 
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentDetail;