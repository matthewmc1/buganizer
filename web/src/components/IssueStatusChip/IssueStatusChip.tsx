// src/components/IssueStatusChip/IssueStatusChip.tsx
import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { 
  FiberNew as NewIcon,
  AssignmentInd as AssignedIcon,
  Build as InProgressIcon,
  Done as FixedIcon,
  CheckCircle as VerifiedIcon,
  Cancel as ClosedIcon,
  ContentCopy as DuplicateIcon,
  Block as WontFixIcon,
} from '@mui/icons-material';
import { Status } from '../../types/issues';

interface IssueStatusChipProps {
  status: Status | string;
}

const IssueStatusChip: React.FC<IssueStatusChipProps> = ({ status }) => {
  const theme = useTheme();

  const getStatusConfig = (status: string): { 
    color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning", 
    icon: React.ReactElement | null, 
    label: string 
  } => {
    switch (status) {
      case Status.NEW:
        return {
          color: 'info',
          icon: <NewIcon fontSize="small" />,
          label: 'New'
        };
      case Status.ASSIGNED:
        return {
          color: 'secondary',
          icon: <AssignedIcon fontSize="small" />,
          label: 'Assigned'
        };
      case Status.IN_PROGRESS:
        return {
          color: 'primary',
          icon: <InProgressIcon fontSize="small" />,
          label: 'In Progress'
        };
      case Status.FIXED:
        return {
          color: 'success',
          icon: <FixedIcon fontSize="small" />,
          label: 'Fixed'
        };
      case Status.VERIFIED:
        return {
          color: 'success',
          icon: <VerifiedIcon fontSize="small" />,
          label: 'Verified'
        };
      case Status.CLOSED:
        return {
          color: 'default',
          icon: <ClosedIcon fontSize="small" />,
          label: 'Closed'
        };
      case Status.DUPLICATE:
        return {
          color: 'warning',
          icon: <DuplicateIcon fontSize="small" />,
          label: 'Duplicate'
        };
      case Status.WONT_FIX:
        return {
          color: 'error',
          icon: <WontFixIcon fontSize="small" />,
          label: "Won't Fix"
        };
      default:
        return {
          color: 'default',
          icon: null,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      {...(config.icon ? { icon: config.icon } : {})}
      variant="filled"
      sx={{ 
        fontWeight: 500,
        '& .MuiChip-icon': {
          marginLeft: '4px',
        }
      }}
    />
  );
};

export default IssueStatusChip;