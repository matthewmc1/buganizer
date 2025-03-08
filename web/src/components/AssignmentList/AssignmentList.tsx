// src/components/AssignmentList/AssignmentList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import { Assignment, AssignmentStatus } from '../../types/assignments';
import { useAssignments } from '../../hooks/useAssignments';

interface Column {
  id: keyof Assignment | 'actions' | 'customerCount' | 'componentCount';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, assignment?: Assignment) => React.ReactNode;
  sortable?: boolean;
}

const AssignmentList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof Assignment>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | ''>('');
  
  const { assignments, loading, totalAssignments, fetchAssignments } = useAssignments();

  useEffect(() => {
    fetchAssignments({
      search: searchQuery,
      status: filterStatus,
      page,
      pageSize: rowsPerPage,
      orderBy,
      order,
    });
  }, [fetchAssignments, searchQuery, filterStatus, page, rowsPerPage, orderBy, order]);

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

  const handleFilterStatusChange = (status: AssignmentStatus | '') => {
    setFilterStatus(status);
    setPage(0);
  };

  const handleSort = (column: keyof Assignment) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

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
      minWidth: 120, 
      align: 'center',
      format: (value: AssignmentStatus) => (
        <Chip
          label={value}
          color={getStatusColor(value)}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ),
      sortable: true,
    },
    { 
      id: 'priority', 
      label: 'Priority', 
      minWidth: 100,
      align: 'center',
      format: (value: string) => (
        <Chip
          label={value}
          color={value === 'P0' ? 'error' : value === 'P1' ? 'warning' : 'primary'}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
      sortable: true,
    },
    { 
      id: 'teamId', 
      label: 'Team', 
      minWidth: 150,
      sortable: true,
      format: (value: string) => (
        <Chip 
          icon={<GroupIcon fontSize="small" />}
          label={value} // In a real app, would show team name
          color="default" 
          size="small"
          variant="outlined"
        />
      )
    },
    { 
      id: 'customerCount', 
      label: 'Customers', 
      minWidth: 100,
      align: 'center',
      format: (value: number, assignment?: Assignment) => (
        <Chip 
          icon={<BusinessIcon fontSize="small" />}
          label={assignment?.customerId?.length || 0} 
          color="default" 
          size="small"
          variant="outlined"
        />
      )
    },
    { 
      id: 'componentCount', 
      label: 'Components', 
      minWidth: 120,
      align: 'center',
      format: (value: number, assignment?: Assignment) => (
        <Chip 
          label={assignment?.componentIds?.length || 0} 
          color="default" 
          size="small"
          variant="outlined"
        />
      )
    },
    { 
      id: 'targetDate', 
      label: 'Target Date', 
      minWidth: 120,
      sortable: true,
      format: (value: string | undefined) => {
        if (!value) return <Typography variant="body2" color="text.secondary">None</Typography>;
        const dueDate = new Date(value);
        const now = new Date();
        const isOverdue = dueDate < now;
        const isNearlyDue = !isOverdue && (dueDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days
        
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
      format: (value: any, assignment?: Assignment) => assignment ? <ActionsMenu assignment={assignment} /> : null
    },
  ];

  interface ActionsMenuProps {
    assignment: Assignment;
  }
  
  const ActionsMenu: React.FC<ActionsMenuProps> = ({ assignment }) => {
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
            to={`/assignments/${assignment.id}`}
            onClick={handleClose}
          >
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View Details" />
          </MenuItem>
          <MenuItem 
            component={Link} 
            to={`/assignments/${assignment.id}/edit`}
            onClick={handleClose}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          <MenuItem 
            component={Link} 
            to={`/assignments/${assignment.id}/issues`}
            onClick={handleClose}
          >
            <ListItemIcon>
              <GroupIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View Issues" />
          </MenuItem>
        </Menu>
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Assignments
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/assignments/new"
          sx={{ mb: 2 }}
        >
          New Assignment
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          placeholder="Search assignments..."
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
            onClick={(e) => e.preventDefault()}
            sx={{ position: 'relative' }}
          >
            {filterStatus ? `Status: ${filterStatus}` : 'All Statuses'}
          </Button>
          
          <Menu
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={false} // Controlled by your own state
            onClose={() => {}} // Your handler
          >
            <MenuItem onClick={() => handleFilterStatusChange('')}>
              All Statuses
            </MenuItem>
            <MenuItem onClick={() => handleFilterStatusChange(AssignmentStatus.PLANNING)}>
              Planning
            </MenuItem>
            <MenuItem onClick={() => handleFilterStatusChange(AssignmentStatus.IN_PROGRESS)}>
              In Progress
            </MenuItem>
            <MenuItem onClick={() => handleFilterStatusChange(AssignmentStatus.TESTING)}>
              Testing
            </MenuItem>
            <MenuItem onClick={() => handleFilterStatusChange(AssignmentStatus.COMPLETED)}>
              Completed
            </MenuItem>
            <MenuItem onClick={() => handleFilterStatusChange(AssignmentStatus.CANCELLED)}>
              Cancelled
            </MenuItem>
          </Menu>
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
                      onClick={() => column.sortable && column.id !== 'actions' && 
                                    column.id !== 'customerCount' && 
                                    column.id !== 'componentCount' && 
                                    handleSort(column.id as keyof Assignment)}
                    >
                      {column.label}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow 
                  hover 
                  key={assignment.id}
                  component={Link}
                  to={`/assignments/${assignment.id}`}
                  sx={{ 
                    textDecoration: 'none',
                    '&:nth-of-type(odd)': {
                      backgroundColor: theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.02) : alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  {columns.map((column) => {
                    const value = column.id === 'customerCount' ? 
                      (assignment.customerId ? assignment.customerId.length : 0) :
                      column.id === 'componentCount' ? 
                      (assignment.componentIds ? assignment.componentIds.length : 0) :
                      assignment[column.id as keyof Assignment];
                      
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format 
                          ? column.format(value, assignment) 
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
              
              {assignments.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No assignments found matching the current filters
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('');
                      }}
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
          count={totalAssignments}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default AssignmentList;