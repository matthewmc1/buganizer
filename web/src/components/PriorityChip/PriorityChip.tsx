// src/components/PriorityChip/PriorityChip.tsx
import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { 
  PriorityHigh as HighIcon,
  ErrorOutline as MediumIcon,
  ArrowDownward as LowIcon,
} from '@mui/icons-material';
import { Priority } from '../../types/issues';

interface PriorityChipProps {
  priority: Priority | string;
}

const PriorityChip: React.FC<PriorityChipProps> = ({ priority }) => {
  const theme = useTheme();

  const getPriorityConfig = (priority: string): { 
    color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning", 
    icon: React.ReactElement | null,
    label: string, 
    bgcolor?: string, 
    textColor?: string 
  } => {
    switch (priority) {
      case Priority.P0:
        return {
          color: 'error',
          icon: <HighIcon fontSize="small" />,
          label: 'P0 - Critical',
          bgcolor: theme.palette.error.main,
          textColor: theme.palette.error.contrastText,
        };
      case Priority.P1:
        return {
          color: 'warning',
          icon: <HighIcon fontSize="small" />,
          label: 'P1 - High',
          bgcolor: theme.palette.warning.main,
          textColor: theme.palette.warning.contrastText,
        };
      case Priority.P2:
        return {
          color: 'primary',
          icon: <MediumIcon fontSize="small" />,
          label: 'P2 - Medium',
          bgcolor: theme.palette.primary.main,
          textColor: theme.palette.primary.contrastText,
        };
      case Priority.P3:
        return {
          color: 'info',
          icon: <LowIcon fontSize="small" />,
          label: 'P3 - Low',
          bgcolor: theme.palette.info.main,
          textColor: theme.palette.info.contrastText,
        };
      case Priority.P4:
        return {
          color: 'default',
          icon: <LowIcon fontSize="small" />,
          label: 'P4 - Trivial',
          bgcolor: theme.palette.grey[400],
          textColor: theme.palette.getContrastText(theme.palette.grey[400]),
        };
      default:
        return {
          color: 'default',
          icon: null,
          label: priority,
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      {...(config.icon ? { icon: config.icon } : {})}
      sx={{ 
        fontWeight: 500,
        backgroundColor: config.bgcolor,
        color: config.textColor,
        '& .MuiChip-icon': {
          marginLeft: '4px',
          color: 'inherit',
        }
      }}
    />
  );
};

export default PriorityChip;