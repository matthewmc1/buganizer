// src/components/TeamsList/TeamsList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string;
  leadName?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

const TeamsList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { organization } = useAuth();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  
  // Team form state
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  
  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.teams.getTeams();
        
        // Fetch member counts for each team
        const teamsWithCounts = await Promise.all(
          response.data.map(async (team: any) => {
            const membersResponse = await api.teams.getTeamMembers(team.id);
            // If team has a lead, get their name
            let leadName;
            if (team.leadId) {
              const leadResponse = await api.users.getUser(team.leadId);
              leadName = leadResponse.data.name;
            }
            
            return {
              ...team,
              leadName,
              memberCount: membersResponse.data.length,
            };
          })
        );
        
        setTeams(teamsWithCounts);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);
  
  // Handle create/edit team dialog
  const handleOpenCreateDialog = () => {
    // Reset form
    setTeamName('');
    setTeamDescription('');
    setTeamLeadId('');
    setTeamFormError(null);
    setCreateDialogOpen(true);
  };
  
  const handleOpenEditDialog = (team: Team) => {
    setTeamName(team.name);
    setTeamDescription(team.description);
    setTeamLeadId(team.leadId);
    setTeamFormError(null);
    setEditTeamId(team.id);
    setCreateDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setEditTeamId(null);
  };
  
  // Handle create/edit team submission
  const handleTeamSubmit = async () => {
    if (!teamName) {
      setTeamFormError('Team name is required');
      return;
    }
    
    setTeamFormError(null);
    
    try {
      if (editTeamId) {
        // Update existing team
        await api.teams.updateTeam(editTeamId, {
          name: teamName,
          description: teamDescription,
          leadId: teamLeadId || undefined,
        });
      } else {
        // Create new team
        await api.teams.createTeam({
          name: teamName,
          description: teamDescription,
          leadId: teamLeadId || undefined,
          organizationId: organization?.id,
        });
      }
      
      // Refresh teams list
      const response = await api.teams.getTeams();
      setTeams(response.data);
      
      // Close dialog
      handleCloseCreateDialog();
    } catch (err) {
      console.error('Error saving team:', err);
      setTeamFormError('Failed to save team. Please try again.');
    }
  };
  
  // Handle delete team
  const handleOpenDeleteDialog = (teamId: string) => {
    setDeleteTeamId(teamId);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTeamId(null);
  };
  
  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;
    
    try {
      await api.teams.deleteTeam(deleteTeamId);
      
      // Refresh teams list
      const response = await api.teams.getTeams();
      setTeams(response.data);
      
      // Close dialog
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team. Please try again.');
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Teams</Typography>
        
        {hasPermission('team', 'create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Team
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : teams.length > 0 ? (
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} md={6} lg={4} key={team.id}>
              <Card 
                variant="outlined"
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="h2">
                      {team.name}
                    </Typography>
                    <Chip 
                      label={`${team.memberCount} ${team.memberCount === 1 ? 'member' : 'members'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                    {team.description || "No description provided."}
                  </Typography>
                  
                  {team.leadId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Lead: <strong>{team.leadName || team.leadId}</strong>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<GroupIcon />} 
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    View Team
                  </Button>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  {hasPermission('team', 'update') && (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenEditDialog(team)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  
                  {hasPermission('team', 'delete') && (
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleOpenDeleteDialog(team.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Teams Found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {hasPermission('team', 'create') 
              ? "Get started by creating your first team."
              : "There are no teams in your organization yet."}
          </Typography>
          
          {hasPermission('team', 'create') && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ mt: 1 }}
            >
              Create First Team
            </Button>
          )}
        </Paper>
      )}
      
      {/* Create/Edit Team Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        aria-labelledby="team-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="team-dialog-title">
          {editTeamId ? 'Edit Team' : 'Create Team'}
        </DialogTitle>
        <DialogContent>
          {teamFormError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {teamFormError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            label="Team Name"
            fullWidth
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            margin="normal"
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            margin="normal"
          />
          
          {/* You would have a user selector here */}
          <TextField
            label="Team Lead (User ID)"
            fullWidth
            value={teamLeadId}
            onChange={(e) => setTeamLeadId(e.target.value)}
            margin="normal"
            helperText="In a real app, this would be a user selector"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleTeamSubmit}
          >
            {editTeamId ? 'Save Changes' : 'Create Team'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Team Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-team-dialog-title"
      >
        <DialogTitle id="delete-team-dialog-title">
          Delete Team
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this team? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Note: This will not delete the team members, but they will be removed from the team.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteTeam}
          >
            Delete Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamsList;