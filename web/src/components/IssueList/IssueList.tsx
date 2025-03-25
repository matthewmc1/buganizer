// src/components/IssueList/IssueList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ViewList as ViewListIcon,
  MoreVert as MoreVertIcon,
  ViewModule as ViewModuleIcon,
  ViewStream as ViewStreamIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import { Issue, Priority, Severity, Status } from '../../types/issues';
import { useIssues } from '../../hooks/useIssues';
import { SavedView } from '../../types/views';
import { useViews } from '../../hooks/useViews';
import IssueStatusChip from '../IssueStatusChip/IssueStatusChip';
import PriorityChip from '../PriorityChip/PriorityChip';
import SeverityChip from '../SeverityChip/SeverityChip';
import SaveViewDialog from '../SaveViewDialog/SaveViewDialog';

interface Column {
  id: keyof Issue | 'actions';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, issue?: Issue) => React.ReactNode;
  sortable?: boolean;
}

const columns: Column[] = [
  { 
    id: 'id', 
    label: 'ID', 
    minWidth: 80,
    sortable: true, 
    format: (value: string) => value.slice(0, 8)
  },
  { 
    id: 'title', 
    label: 'Title', 
    minWidth: 250,
    sortable: true, 
  },
  { 
    id: 'status', 
    label: 'Status', 
    minWidth: 100, 
    align: 'center',
    format: (value: Status) => <IssueStatusChip status={value} />,
    sortable: true,
  },
  { 
    id: 'priority', 
    label: 'Priority', 
    minWidth: 100,
    align: 'center',
    format: (value: Priority) => <PriorityChip priority={value} />,
    sortable: true,
  },
  { 
    id: 'severity', 
    label: 'Severity', 
    minWidth: 100,
    align: 'center',
    format: (value: Severity) => <SeverityChip severity={value} />,
    sortable: true,
  },
  { 
    id: 'assigneeId', 
    label: 'Assignee', 
    minWidth: 150,
    sortable: true,
    format: (value: string | null) => value ? 
      <Chip 
        size="small" 
        label={value} // In real app, would show user name, not ID
        color="default" 
        variant="outlined"
        avatar={
          <Box component="span" sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {value.charAt(0).toUpperCase()}
          </Box>
        }
      /> : 
      <Typography variant="body2" color="text.secondary">Unassigned</Typography>
  },
  { 
    id: 'createdAt', 
    label: 'Created', 
    minWidth: 120,
    sortable: true,
    format: (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true }),
  },
  { 
    id: 'dueDate', 
    label: 'Due Date', 
    minWidth: 120,
    sortable: true,
    format: (value: string | null, issue?: Issue) => {
      if (!value) return <Typography variant="body2" color="text.secondary">None</Typography>;
      const dueDate = new Date(value);
      const now = new Date();
      const isOverdue = dueDate < now;
      const isNearlyDue = !isOverdue && (dueDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000; // 24 hours
      
      return (
        <Tooltip title={dueDate.toLocaleString()}>
          <Typography 
            variant="body2" 
            color={isOverdue ? 'error' : isNearlyDue ? 'warning.main' : 'text.primary'}
            fontWeight={isOverdue || isNearlyDue ? 500 : 400}
          >
            {formatDistanceToNow(dueDate, { addSuffix: true })}
          </Typography>
        </Tooltip>
      );
    }
  },
  { 
    id: 'actions', 
    label: 'Actions', 
    minWidth: 80,
    align: 'center',
    format: (value: any, issue?: Issue) => issue ? <ActionsMenu issue={issue} /> : null
  },
];

interface ActionsMenuProps {
  issue: Issue;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ issue }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200, borderRadius: 2 }
        }}
      >
        <MenuItem 
          component={Link} 
          to={`/issues/${issue.id}`}
          onClick={handleClose}
        >
          <ListItemIcon>
            <ViewListIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Add Comment" />
        </MenuItem>
      </Menu>
    </>
  );
};

interface IssueListProps {
  defaultFilter?: string;
  savedViewId?: string;
}

const IssueList: React.FC<IssueListProps> = ({ defaultFilter = 'is:open', savedViewId }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof Issue>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [viewMenuAnchorEl, setViewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'list'>('table');
  const [tabValue, setTabValue] = useState(0);
  
  const { issues, loading, totalIssues, fetchIssues } = useIssues();
  const { savedViews, loading: viewsLoading, fetchSavedViews } = useViews();

  // If a savedViewId is provided, load that view
  useEffect(() => {
    if (savedViewId) {
      const view = savedViews.find(v => v.id === savedViewId);
      if (view) {
        setFilter(view.queryString);
      }
    }
  }, [savedViewId, savedViews]);

  // Apply filter when it changes
  useEffect(() => {
    const finalFilter = searchQuery 
      ? `${filter} ${searchQuery}` 
      : filter;
      
    fetchIssues({
      filter: finalFilter,
      page,
      pageSize: rowsPerPage,
      orderBy,
      order,
    });
  }, [filter, searchQuery, page, rowsPerPage, orderBy, order, fetchIssues]);

  // Load saved views
  useEffect(() => {
    fetchSavedViews();
  }, [fetchSavedViews]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleSort = (column: keyof Issue) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    switch (newValue) {
      case 0: // All Issues
        setFilter('');
        break;
      case 1: // Open Issues
        setFilter('is:open');
        break;
      case 2: // My Issues
        setFilter('assignee:me');
        break;
      case 3: // Critical Issues
        setFilter('priority:p0 OR severity:s0');
        break;
    }
  };

  const handleSaveViewClick = () => {
    setSaveViewDialogOpen(true);
  };

  const handleSaveViewClose = () => {
    setSaveViewDialogOpen(false);
  };

  const handleSaveView = (name: string, isTeamView: boolean, teamId?: string) => {
    // Save the view via API
    // After saving, refresh the views list
    console.log('Saving view:', { name, filter, isTeamView, teamId });
    setSaveViewDialogOpen(false);
    fetchSavedViews();
  };

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setViewMenuAnchorEl(event.currentTarget);
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchorEl(null);
  };

  const handleViewSelect = (view: SavedView) => {
    setFilter(view.queryString);
    setViewMenuAnchorEl(null);
  };

  const handleRefresh = () => {
    fetchIssues({
      filter,
      page,
      pageSize: rowsPerPage,
      orderBy,
      order,
    });
  };

  const renderIssueCards = () => {
    if (issues.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No issues found matching the current filters
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {issues.map((issue) => (
          <Card 
            key={issue.id}
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[3],
              }
            }}
            onClick={() => navigate(`/issues/${issue.id}`)}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500,
                  }}
                >
                  {issue.id.slice(0, 8)}
                </Typography>
                <IconButton size="small">
                  <BookmarkBorderIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography 
                variant="subtitle2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'medium',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  height: 40
                }}
              >
                {issue.title}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
                <IssueStatusChip status={issue.status} />
                <PriorityChip priority={issue.priority} />
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                {issue.assigneeId ? (
                  <Chip 
                    size="small" 
                    label={issue.assigneeId} 
                    color="default" 
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  const renderIssueList = () => {
    if (issues.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No issues found matching the current filters
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {issues.map((issue) => (
          <Card 
            key={issue.id}
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateX(2px)',
                boxShadow: theme.shadows[2],
              },
              position: 'relative',
              overflow: 'visible', // For due date label
            }}
            onClick={() => navigate(`/issues/${issue.id}`)}
          >
            <CardContent sx={{ p: 2, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    px: 1,
                    py: 1,
                    height: 28,
                    minWidth: 70,
                    borderRadius: 1,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                  }}
                >
                  {issue.id.slice(0, 8)}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                    {issue.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <IssueStatusChip status={issue.status} />
                    <PriorityChip priority={issue.priority} />
                    <SeverityChip severity={issue.severity} />
                    {issue.labels && issue.labels.map(label => (
                      <Chip key={label} label={label} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  {issue.assigneeId ? (
                    <Chip 
                      size="small" 
                      label={issue.assigneeId} 
                      color="default" 
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </Box>
              
              {issue.dueDate && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: -10,
                    right: 16,
                    bgcolor: new Date(issue.dueDate) < new Date() ? 
                      theme.palette.error.main : 
                      theme.palette.warning.main,
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  Due {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true })}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Issues
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/issues/new"
          sx={{ mb: 2 }}
        >
          New Issue
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          placeholder="Search issues..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ 
            flexGrow: 1, 
            minWidth: '200px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.paper,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            size="medium"
          >
            Filters
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ViewListIcon />}
            size="medium"
            onClick={handleViewMenuOpen}
          >
            Views
          </Button>
          
          <Menu
            anchorEl={viewMenuAnchorEl}
            open={Boolean(viewMenuAnchorEl)}
            onClose={handleViewMenuClose}
            PaperProps={{
              elevation: 3,
              sx: { width: 240, maxHeight: 500, mt: 1.5, borderRadius: 2 },
            }}
          >
            <MenuItem disabled={viewsLoading}>
              <Typography variant="subtitle2">Saved Views</Typography>
            </MenuItem>
            
            {viewsLoading ? (
              <MenuItem disabled>
                <ListItemText primary="Loading..." />
              </MenuItem>
            ) : savedViews.length === 0 ? (
              <MenuItem disabled>
                <ListItemText primary="No saved views" />
              </MenuItem>
            ) : (
              savedViews.map((view) => (
                <MenuItem 
                  key={view.id} 
                  onClick={() => handleViewSelect(view)}
                >
                  <ListItemIcon>
                    <BookmarkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={view.name} />
                </MenuItem>
              ))
            )}
            
            <Divider />
            <MenuItem onClick={() => {
              handleViewMenuClose();
              handleSaveViewClick();
            }}>
              <ListItemIcon>
                <SaveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Save Current View" />
            </MenuItem>
          </Menu>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            size="medium"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          
          <Box sx={{ display: 'flex', border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Tooltip title="Table View">
              <IconButton 
                size="small" 
                onClick={() => setViewMode('table')}
                color={viewMode === 'table' ? 'primary' : 'default'}
                sx={{ 
                  borderRadius: 0,
                  backgroundColor: viewMode === 'table' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                <ViewListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Card View">
              <IconButton 
                size="small" 
                onClick={() => setViewMode('cards')}
                color={viewMode === 'cards' ? 'primary' : 'default'}
                sx={{ 
                  borderRadius: 0,
                  backgroundColor: viewMode === 'cards' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                <ViewModuleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton 
                size="small" 
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
                sx={{ 
                  borderRadius: 0,
                  backgroundColor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
              >
                <ViewStreamIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              minWidth: 120,
              fontWeight: 500,
            },
          }}
        >
          <Tab 
            label="All Issues" 
            icon={<Badge badgeContent={totalIssues} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }} />} 
            iconPosition="end"
          />
          <Tab 
            label="Open Issues" 
            icon={<Badge badgeContent={issues.filter(i => i.status !== 'CLOSED').length} color="info" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }} />} 
            iconPosition="end"
          />
          <Tab 
            label="My Issues" 
            icon={<Badge badgeContent={issues.filter(i => i.assigneeId === 'user-1').length} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }} />} 
            iconPosition="end"
          />
          <Tab 
            label="Critical Issues" 
            icon={<Badge badgeContent={issues.filter(i => i.priority === 'P0' || i.severity === 'S0').length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }} />} 
            iconPosition="end"
          />
        </Tabs>
      </Box>
      
      {filter && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
            Active filters:
          </Typography>
          <Chip 
            label={filter} 
            onDelete={() => setFilter('')} 
            color="primary" 
            variant="outlined"
            size="small"
          />
        </Box>
      )}
      
      <Paper sx={{ position: 'relative', mb: 3, overflow: 'hidden', borderRadius: 2 }}>
        {loading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 3, 
              zIndex: 1 
            }} 
          />
        )}
        
        {viewMode === 'table' && (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 330px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                        sx={{ 
                          bgcolor: 'background.default',
                          fontWeight: 600,
                          py: 1.5,
                        }}
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: column.align === 'center' ? 'center' : 'flex-start',
                            cursor: column.sortable ? 'pointer' : 'default'
                          }}
                          onClick={() => column.sortable && column.id !== 'actions' && handleSort(column.id as keyof Issue)}
                        >
                          {column.label}
                          
                          {column.sortable && column.id === orderBy && (
                            <Box component="span" sx={{ ml: 0.5 }}>
                              {order === 'desc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow 
                      hover 
                      key={issue.id}
                      component={Link}
                      to={`/issues/${issue.id}`}
                      sx={{ 
                        textDecoration: 'none',
                        '&:nth-of-type(odd)': {
                          backgroundColor: theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.02) : alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      {columns.map((column) => {
                        const value = issue[column.id as keyof Issue];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format 
                              ? column.format(value, issue) 
                              : column.id === 'title' 
                                ? (
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="medium" 
                                    color="primary.main"
                                    sx={{ 
                                      maxWidth: 450, 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {value as string}
                                  </Typography>
                                ) 
                                : value
                            }
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  
                  {issues.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No issues found matching the current filters
                        </Typography>
                        <Button 
                          variant="outlined" 
                          onClick={() => setFilter('')}
                          sx={{ mt: 2 }}
                        >
                          Clear Filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalIssues}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}

        {viewMode === 'cards' && (
          <Box sx={{ p: 2 }}>
            {renderIssueCards()}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalIssues}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          </Box>
        )}

        {viewMode === 'list' && (
          <Box sx={{ p: 2 }}>
            {renderIssueList()}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalIssues}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          </Box>
        )}
      </Paper>
      
      <SaveViewDialog
        open={saveViewDialogOpen}
        onClose={handleSaveViewClose}
        onSave={handleSaveView}
        query={filter}
      />
    </Box>
  );
};

export default IssueList;