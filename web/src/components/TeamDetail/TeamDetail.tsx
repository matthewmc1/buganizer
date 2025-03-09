// src/components/TeamDetail/TeamDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Divider,
    Grid,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    IconButton,
    Tooltip,
    Alert,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tab,
    Tabs,
    ListItemButton,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    GroupWork as GroupWorkIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    BugReport as BugReportIcon,
    RemoveCircle as RemoveCircleIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { Role } from '../../types/permissions';

interface TeamMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

interface TeamDetails {
    id: string;
    name: string;
    description: string;
    leadId: string;
    leadName?: string;
    createdAt: string;
    updatedAt: string;
}

interface Issue {
    id: string;
    title: string;
    status: string;
    priority: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`team-tabpanel-${index}`}
            aria-labelledby={`team-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const TeamDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { organization } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [team, setTeam] = useState<TeamDetails | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [tabValue, setTabValue] = useState(0);

    // Dialog states
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role>(Role.DEVELOPER);
    const [editedRole, setEditedRole] = useState<Role>(Role.DEVELOPER);

    // Load team data
    useEffect(() => {
        const fetchTeamData = async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                // Get team details
                const teamResponse = await api.teams.getTeam(id);
                const teamData = teamResponse.data;

                // Get team lead name if available
                if (teamData.leadId) {
                    const leadResponse = await api.users.getUser(teamData.leadId);
                    teamData.leadName = leadResponse.data.name;
                }

                setTeam(teamData);

                // Get team members
                const membersResponse = await api.teams.getTeamMembers(id);

                // Augment member data with user details
                const membersWithDetails = await Promise.all(
                    membersResponse.data.map(async (member: any) => {
                        const userResponse = await api.users.getUser(member.userId);
                        return {
                            ...member,
                            name: userResponse.data.name,
                            email: userResponse.data.email,
                            avatarUrl: userResponse.data.avatarUrl,
                        };
                    })
                );

                setMembers(membersWithDetails);

                // Get team issues
                const issuesResponse = await api.teams.getTeamIssues(id);
                setIssues(issuesResponse.data);
            } catch (err) {
                console.error('Error fetching team data:', err);
                setError('Failed to load team data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [id]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Handle adding a new team member
    const handleOpenAddMemberDialog = () => {
        setNewUserEmail('');
        setNewUserRole(Role.DEVELOPER);
        setAddMemberDialogOpen(true);
    };

    const handleCloseAddMemberDialog = () => {
        setAddMemberDialogOpen(false);
    };

    const handleAddMember = async () => {
        if (!id || !newUserEmail) return;

        try {
            await api.teams.addTeamMember(id, {
                email: newUserEmail,
                role: newUserRole
            });

            // Refresh member list
            const membersResponse = await api.teams.getTeamMembers(id);

            // Augment member data with user details
            const membersWithDetails = await Promise.all(
                membersResponse.data.map(async (member: any) => {
                    const userResponse = await api.users.getUser(member.userId);
                    return {
                        ...member,
                        name: userResponse.data.name,
                        email: userResponse.data.email,
                        avatarUrl: userResponse.data.avatarUrl,
                    };
                })
            );

            setMembers(membersWithDetails);

            // Close dialog
            handleCloseAddMemberDialog();
        } catch (err) {
            console.error('Error adding team member:', err);
            setError('Failed to add team member. Please try again.');
        }
    };

    // Handle changing a member's role
    // In handleOpenChangeRoleDialog, ensure we convert string to Role enum
    const handleOpenChangeRoleDialog = (member: TeamMember) => {
        setSelectedMember(member);
        // Make sure to convert the string role to the proper Role enum
        setEditedRole(member.role as Role);
        setChangeRoleDialogOpen(true);
    };

    const handleCloseChangeRoleDialog = () => {
        setChangeRoleDialogOpen(false);
        setSelectedMember(null);
    };

    const handleChangeRole = async () => {
        if (!id || !selectedMember) return;

        try {
            await api.teams.updateTeamMember(id, selectedMember.userId, {
                role: editedRole
            });

            // Refresh member list
            const membersResponse = await api.teams.getTeamMembers(id);

            // Augment member data with user details
            const membersWithDetails = await Promise.all(
                membersResponse.data.map(async (member: any) => {
                    const userResponse = await api.users.getUser(member.userId);
                    return {
                        ...member,
                        name: userResponse.data.name,
                        email: userResponse.data.email,
                        avatarUrl: userResponse.data.avatarUrl,
                    };
                })
            );

            setMembers(membersWithDetails);

            // Close dialog
            handleCloseChangeRoleDialog();
        } catch (err) {
            console.error('Error updating team member role:', err);
            setError('Failed to update member role. Please try again.');
        }
    };

    // Handle removing a member from the team
    const handleRemoveMember = async (userId: string) => {
        if (!id) return;

        if (!confirm('Are you sure you want to remove this member from the team?')) {
            return;
        }

        try {
            await api.teams.removeTeamMember(id, userId);

            // Refresh member list
            setMembers(members.filter(member => member.userId !== userId));
        } catch (err) {
            console.error('Error removing team member:', err);
            setError('Failed to remove team member. Please try again.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !team) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Team not found'}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/teams')}
                >
                    Back to Teams
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/teams')}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" component="h1">
                        {team.name}
                    </Typography>
                </Box>

                {hasPermission('team', 'update') && (
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/teams/${id}/edit`)}
                    >
                        Edit Team
                    </Button>
                )}
            </Box>

            {team.description && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="body1">
                        {team.description}
                    </Typography>
                </Paper>
            )}

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <GroupWorkIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Team Summary</Typography>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Team Lead:
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                {team.leadId ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar
                                            src=""
                                            sx={{ width: 24, height: 24, mr: 1 }}
                                        >
                                            {team.leadName?.charAt(0) || team.leadId.charAt(0)}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight="medium">
                                            {team.leadName || team.leadId}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No team lead assigned
                                    </Typography>
                                )}
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Members:
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">
                                    {members.length}
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Active Issues:
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">
                                    {issues.filter(issue => issue.status !== 'CLOSED').length}
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">
                                    Created:
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">
                                    {new Date(team.createdAt).toLocaleDateString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <BugReportIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Issue Statistics</Typography>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {issues.length > 0 ? (
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary.main">
                                            {issues.filter(issue => issue.status === 'OPEN' || issue.status === 'IN_PROGRESS').length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Open Issues
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {issues.filter(issue => issue.status === 'CLOSED').length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Closed Issues
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, textAlign: 'center' }}>
                                        <Typography variant="h4" color="error.main">
                                            {issues.filter(issue => issue.priority === 'P0' || issue.priority === 'P1').length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            High Priority
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, textAlign: 'center' }}>
                                        <Typography variant="h4" color="info.main">
                                            {issues.filter(issue => issue.priority === 'P2' || issue.priority === 'P3' || issue.priority === 'P4').length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Normal Priority
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="textSecondary" align="center">
                                No issues assigned to this team yet.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="team tabs"
                    >
                        <Tab label="Members" id="team-tab-0" icon={<PersonIcon />} iconPosition="start" />
                        <Tab label="Issues" id="team-tab-1" icon={<BugReportIcon />} iconPosition="start" />
                        <Tab label="Assignments" id="team-tab-2" icon={<AssignmentIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Members Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h6">Team Members</Typography>

                        {hasPermission('team', 'update') && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PersonAddIcon />}
                                onClick={handleOpenAddMemberDialog}
                            >
                                Add Member
                            </Button>
                        )}
                    </Box>

                    {members.length > 0 ? (
                        <List>
                            {members.map((member) => (
                                <ListItem key={member.userId} divider>
                                    <ListItemAvatar>
                                        <Avatar src={member.avatarUrl}>
                                            {member.name.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={member.name}
                                        secondary={member.email}
                                    />
                                    <Chip
                                        label={member.role}
                                        size="small"
                                        color={
                                            member.role === 'ADMIN' ? 'error' :
                                                member.role === 'MANAGER' ? 'warning' :
                                                    member.role === 'DEVELOPER' ? 'primary' :
                                                        'default'
                                        }
                                        sx={{ mr: 2 }}
                                    />

                                    {hasPermission('team', 'update') && (
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Change Role">
                                                <IconButton
                                                    edge="end"
                                                    aria-label="change role"
                                                    onClick={() => handleOpenChangeRoleDialog(member)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Remove from Team">
                                                <IconButton
                                                    edge="end"
                                                    aria-label="remove"
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    color="error"
                                                >
                                                    <RemoveCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="textSecondary">
                                This team doesn't have any members yet.
                            </Typography>

                            {hasPermission('team', 'update') && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<PersonAddIcon />}
                                    onClick={handleOpenAddMemberDialog}
                                    sx={{ mt: 2 }}
                                >
                                    Add First Member
                                </Button>
                            )}
                        </Box>
                    )}
                </TabPanel>

                {/* Issues Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>Team Issues</Typography>

                    {issues.length > 0 ? (
                        <List>
                            {issues.map((issue) => (
                                <ListItemButton
                                    key={issue.id}
                                    divider
                                    onClick={() => navigate(`/issues/${issue.id}`)}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor:
                                                issue.status === 'CLOSED' ? 'success.light' :
                                                    issue.priority === 'P0' ? 'error.light' :
                                                        issue.priority === 'P1' ? 'warning.light' :
                                                            'primary.light'
                                        }}>
                                            <BugReportIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={issue.title}
                                        secondary={`Status: ${issue.status} • Priority: ${issue.priority}`}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="textSecondary">
                                This team doesn't have any issues assigned yet.
                            </Typography>

                            {hasPermission('issue', 'create') && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<BugReportIcon />}
                                    onClick={() => navigate('/issues/new', { state: { teamId: id } })}
                                    sx={{ mt: 2 }}
                                >
                                    Create First Issue
                                </Button>
                            )}
                        </Box>
                    )}
                </TabPanel>

                {/* Assignments Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>Team Assignments</Typography>

                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                            Team assignments feature coming soon.
                        </Typography>
                    </Box>
                </TabPanel>
            </Paper>

            {/* Add Member Dialog */}
            <Dialog
                open={addMemberDialogOpen}
                onClose={handleCloseAddMemberDialog}
                aria-labelledby="add-member-dialog-title"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="add-member-dialog-title">
                    Add Team Member
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                autoFocus
                                label="Email Address"
                                type="email"
                                fullWidth
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                required
                                helperText="User must already exist in the organization"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="new-role-label">Role</InputLabel>
                                <Select
                                    labelId="new-role-label"
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                                    label="Role"
                                >
                                    <MenuItem value={Role.MANAGER}>Manager</MenuItem>
                                    <MenuItem value={Role.DEVELOPER}>Developer</MenuItem>
                                    <MenuItem value={Role.VIEWER}>Viewer</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddMemberDialog}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddMember}
                    >
                        Add Member
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog
                open={changeRoleDialogOpen}
                onClose={handleCloseChangeRoleDialog}
                aria-labelledby="change-role-dialog-title"
            >
                <DialogTitle id="change-role-dialog-title">
                    Change Member Role
                </DialogTitle>
                <DialogContent>
                    {selectedMember && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle1">
                                {selectedMember.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                {selectedMember.email}
                            </Typography>

                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel id="edit-role-label">Role</InputLabel>
                                <Select
                                    labelId="edit-role-label"
                                    value={editedRole}
                                    onChange={(e) => setEditedRole(e.target.value as Role)}
                                    label="Role"
                                >
                                    <MenuItem value={Role.MANAGER}>Manager</MenuItem>
                                    <MenuItem value={Role.DEVELOPER}>Developer</MenuItem>
                                    <MenuItem value={Role.VIEWER}>Viewer</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseChangeRoleDialog}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleChangeRole}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamDetail;