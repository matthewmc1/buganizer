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
  ListItemText
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
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
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
  format?: (value: any) => React.ReactNode;
  sortable?: boolean;
}

const columns: Column[] = [
  { 
    id: 'id', 
    label: 'ID', 
    minWidth: 80,
    sortable: true, 
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
      /> : 
      <Typography variant="body2" color="textSecondary">Unassigned</Typography>
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
    format: (value: string | null) => value ? 
      formatDistanceToNow(new Date(value), { addSuffix: true }) : 
      <Typography variant="body2" color="textSecondary">None</Typography>
  },
  { 
    id: 'actions', 
    label: 'Actions', 
    minWidth: 80,
    align: 'center',
    format: (value: any, issue: Issue) => <ActionsMenu issue={issue} />
  },
];

interface ActionsMenuProps {
  issue: Issue;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ issue }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof Issue>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [viewMenuAnchorEl, setViewMenuAnchorEl] = useState<null | HTMLElement>(null);
  
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

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          placeholder="Search issues..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: '200px' }}
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
            size="small"
          >
            Filters
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ViewListIcon />}
            size="small"
            onClick={handleViewMenuOpen}
          >
            Views
          </Button>
          
          <Menu
            anchorEl={viewMenuAnchorEl}
            open={Boolean(viewMenuAnchorEl)}
            onClose={handleViewMenuClose}
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
                  <ListItemText primary={view.name} />
                </MenuItem>
              ))
            )}
            
            <MenuItem onClick={handleViewMenuClose}>
              <Button
                fullWidth
                startIcon={<SaveIcon />}
                onClick={handleSaveViewClick}
                size="small"
              >
                Save Current View
              </Button>
            </MenuItem>
          </Menu>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            size="small"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/issues/new"
          >
            New Issue
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mb: 1 }}>
        <Chip 
          label={filter} 
          onDelete={() => setFilter('is:open')} 
          color="primary" 
          variant="outlined"
        />
      </Box>
      
      <Paper>
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
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
                      backgroundColor: theme => theme.palette.action.hover,
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
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      No issues found matching the current filters
                    </Typography>
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