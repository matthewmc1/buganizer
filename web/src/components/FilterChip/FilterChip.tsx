// src/components/FilterChip/FilterChip.tsx
import React from 'react';
import { Chip, useTheme, alpha } from '@mui/material';

interface FilterChipProps {
  filterKey: string;
  filterValue: string;
  onDelete: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ filterKey, filterValue, onDelete }) => {
  const theme = useTheme();
  
  // Determine color based on filter key
  let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
  
  switch(filterKey) {
    case 'is':
    case 'status':
      color = 'primary';
      break;
    case 'priority':
      color = 'error';
      break;
    case 'severity':
      color = 'warning';
      break;
    case 'assignee':
      color = 'info';
      break;
    case 'due':
      color = 'success';
      break;
    case 'label':
    case 'labels':
      color = 'secondary';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={`${filterKey}:${filterValue}`}
      variant="outlined"
      size="small"
      color={color}
      onDelete={onDelete}
      sx={{
        fontWeight: 500,
        borderWidth: 1.5,
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        }
      }}
    />
  );
};

export default FilterChip;