// src/components/IssueList/IssueList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
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
  Button, 
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  useTheme,
  alpha,
  Popover,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import { 
  Add as AddIcon,
  FilterList as FilterIcon,
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
  Done as DoneIcon,
  CalendarToday as CalendarTodayIcon,
  PriorityHigh as PriorityHighIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import { Issue, Priority, Severity, Status } from '../../types/issues';
import { useIssues } from '../../hooks/useIssues';
import { SavedView } from '../../types/views';
import { useViews } from '../../hooks/useViews';
import IssueStatusChip from '../IssueStatusChip/IssueStatusChip';
import PriorityChip from '../PriorityChip/PriorityChip';
import SeverityChip from '../SeverityChip/SeverityChip';
import SaveViewDialog from '../SaveViewDialog/SaveViewDialog';
import FilterInput from '../FilterInput/FilterInput';
import { FILTER_KEYS, FILTER_VALUES } from '../../utils/filterSuggestions';

// Column definitions - these won't change
import { columns, ActionsMenu } from './IssueListColumns';

interface IssueListProps {
  defaultFilter?: string;
  savedViewId?: string;
}

const IssueList: React.FC<IssueListProps> = ({ defaultFilter = '', savedViewId }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState(defaultFilter);
  const [orderBy, setOrderBy] = useState<keyof Issue>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [viewMenuAnchorEl, setViewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'list'>('table');
  const [tabValue, setTabValue] = useState(0);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  const { issues, loading, totalIssues, fetchIssues } = useIssues({ initialFilter: defaultFilter });
  const { savedViews, loading: viewsLoading, fetchSavedViews } = useViews();

  // Parse URL search params for filter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [location.search]);

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
    fetchIssues({
      filter,
      page,
      pageSize: rowsPerPage,
      orderBy,
      order,
    });
    
    // Update URL with filter
    if (filter) {
      const urlParams = new URLSearchParams(location.search);
      urlParams.set('filter', filter);
      navigate({ search: urlParams.toString() }, { replace: true });
    } else {
      // Remove filter param if no filter
      const urlParams = new URLSearchParams(location.search);
      if (urlParams.has('filter')) {
        urlParams.delete('filter');
        navigate({ search: urlParams.toString() }, { replace: true });
      }
    }
  }, [filter, page, rowsPerPage, orderBy, order, fetchIssues, navigate, location.search]);

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
        setFilter('priority:P0 OR severity:S0');
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

  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setFilterMenuAnchorEl(null);
  };

  const addQuickFilter = (key: string, value: string) => {
    const newFilter = filter ? `${filter} ${key}:${value}` : `${key}:${value}`;
    setFilter(newFilter);
    handleCloseFilterMenu();
  };

  // Render the issue cards view (for viewMode === 'cards')
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

  // Render the issue list view (for viewMode === 'list')
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
      
      <Box sx={{ mb: 3 }}>
        <FilterInput 
          value={filter}
          onChange={setFilter}
          placeholder="Search issues or type filters (e.g., is:open priority:P0)"
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            size="medium"
            onClick={handleOpenFilterMenu}
          >
            Quick Filters
          </Button>
          
          <Popover
            open={Boolean(filterMenuAnchorEl)}
            anchorEl={filterMenuAnchorEl}
            onClose={handleCloseFilterMenu}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Box sx={{ p: 1, width: 250 }}>
              <List dense>
                <ListItem>
                  <Typography variant="subtitle2">Status</Typography>
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('is', 'open')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DoneIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Open Issues" />
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('is', 'assigned')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Assigned Issues" />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <Typography variant="subtitle2">Priority</Typography>
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('priority', 'P0')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PriorityHighIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="P0 (Critical)" />
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('priority', 'P1')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PriorityHighIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText primary="P1 (High)" />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <Typography variant="subtitle2">Due Date</Typography>
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('due', 'today')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CalendarTodayIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Due Today" />
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('due', 'overdue')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <WarningIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Overdue" />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <Typography variant="subtitle2">Assignment</Typography>
                </ListItem>
                <ListItem button onClick={() => addQuickFilter('assignee', 'me')}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText primary="Assigned to Me" />
                </ListItem>
              </List>
            </Box>
          </Popover>
          
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