// src/components/SeverityChip/SeverityChip.tsx
import React from 'react';
import { Chip } from '@mui/material';
import { Severity } from '../../types/issues';

interface SeverityChipProps {
  severity: Severity | string;
}

const SeverityChip: React.FC<SeverityChipProps> = ({ severity }) => {
  const getSeverityColor = (severity: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (severity) {
      case Severity.S0:
        return 'error';
      case Severity.S1:
        return 'warning';
      case Severity.S2:
        return 'info';
      case Severity.S3:
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case Severity.S0:
        return 'S0 - Critical';
      case Severity.S1:
        return 'S1 - Major';
      case Severity.S2:
        return 'S2 - Moderate';
      case Severity.S3:
        return 'S3 - Minor';
      default:
        return severity;
    }
  };

  return (
    <Chip
      label={getSeverityLabel(severity)}
      color={getSeverityColor(severity)}
      size="small"
      variant="outlined"
    />
  );
};

export default SeverityChip;