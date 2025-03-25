// src/components/IssueList/IssueListColumns.tsx
import React, { useState } from 'react';
import { 
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ViewList as ViewListIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

import { Issue, Priority, Severity, Status } from '../../types/issues';
import IssueStatusChip from '../IssueStatusChip/IssueStatusChip';
import PriorityChip from '../PriorityChip/PriorityChip';
import SeverityChip from '../SeverityChip/SeverityChip';

// Column interface definition
export interface Column {
  id: keyof Issue | 'actions' | 'customerCount' | 'componentCount';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, issue?: Issue) => React.ReactNode;
  sortable?: boolean;
}

// Actions menu component
export interface ActionsMenuProps {
  issue: Issue;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({ issue }) => {
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

// Column definitions
export const columns: Column[] = [
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
