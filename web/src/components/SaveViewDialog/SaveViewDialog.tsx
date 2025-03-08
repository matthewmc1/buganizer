// src/components/SaveViewDialog/SaveViewDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Team } from '../../types/users';

interface SaveViewDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, isTeamView: boolean, teamId?: string) => void;
  query: string;
}

const SaveViewDialog: React.FC<SaveViewDialogProps> = ({
  open,
  onClose,
  onSave,
  query,
}) => {
  const [name, setName] = useState('');
  const [isTeamView, setIsTeamView] = useState(false);
  const [teamId, setTeamId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setIsTeamView(false);
      setTeamId('');
      setError(null);
    }
  }, [open]);

  // Fetch teams
  useEffect(() => {
    if (open && isTeamView) {
      setLoading(true);
      // In a real implementation, you would fetch from API
      // For development/demo, use mock data
      setTimeout(() => {
        const mockTeams: Team[] = [
          {
            id: 'team-1',
            name: 'Frontend Team',
            description: 'Responsible for frontend development',
            leadId: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'team-2',
            name: 'Backend Team',
            description: 'Responsible for backend development',
            leadId: 'user-2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'team-3',
            name: 'Design Team',
            description: 'Responsible for UI/UX design',
            leadId: 'user-3',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        
        setTeams(mockTeams);
        setLoading(false);
      }, 300);
    }
  }, [open, isTeamView]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (isTeamView && !teamId) {
      setError('Team is required for team views');
      return;
    }

    onSave(name, isTeamView, isTeamView ? teamId : undefined);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="save-view-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="save-view-dialog-title">Save View</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="View Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Query:
          </Typography>
          <TextField
            margin="dense"
            type="text"
            fullWidth
            value={query}
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isTeamView}
                onChange={(e) => setIsTeamView(e.target.checked)}
                color="primary"
              />
            }
            label="Share with Team"
            sx={{ mb: 2 }}
          />

          {isTeamView && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="team-select-label">Team</InputLabel>
              <Select
                labelId="team-select-label"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                label="Team"
                disabled={loading}
              >
                {loading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading teams...
                  </MenuItem>
                ) : (
                  teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveViewDialog;