// src/components/OrganizationSettings/OrganizationSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Domain as DomainIcon,
  SupervisorAccount as SupervisorAccountIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../utils/api';
import { Role, UserRole } from '../../types/permissions';
import { User } from '../../types/users';
import { Organization } from '../../types/organization';

// Tab panel helper component
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const OrganizationSettings: React.FC = () => {
  const { organization, hasPermission } = useAuth();
  const { hasRole } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Organization state
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [orgSettings, setOrgSettings] = useState({
    allowPublicIssues: false,
    defaultAssigneePolicy: 'MANUAL',
    supportSLA: {
      enabled: true,
      defaultResponseHours: 24,
      defaultResolutionHours: 72,
    },
  });
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Invite user state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(Role.VIEWER);
  const [inviteTeamId, setInviteTeamId] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);
  
  // SSO settings
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('google');
  const [ssoDomain, setSsoDomain] = useState('');
  const [ssoClientId, setSsoClientId] = useState('');
  const [ssoClientSecret, setSsoClientSecret] = useState('');
  
  // Load organization data
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgDomain(organization.domain);
      if (organization.settings) {
        setOrgSettings(organization.settings);
      }
      
      // In a real app, you'd also load SSO settings
      // For this example we'll just use default values
      setSsoDomain(organization.domain);
    }
  }, [organization]);
  
  // Load users and roles
  useEffect(() => {
    const fetchUsers = async () => {
      if (!organization) return;
      
      setLoadingUsers(true);
      try {
        // Fetch users
        const usersResponse = await api.users.getUsers();
        setUsers(usersResponse.data);
        
        // Fetch all user roles
        const allRoles: UserRole[] = [];
        for (const user of usersResponse.data) {
          const rolesResponse = await api.users.getUserRoles(user.id, organization.id);
          allRoles.push(...rolesResponse.data);
        }
        setUserRoles(allRoles);
        
        // Fetch teams
        const teamsResponse = await api.teams.getTeams();
        setTeams(teamsResponse.data);
      } catch (err) {
        console.error('Error fetching users and roles:', err);
        setError('Failed to load users and roles');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [organization]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSaveOrganization = async () => {
    if (!organization) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update org details
      await api.organizations.updateOrganization(organization.id, {
        name: orgName,
        domain: orgDomain,
      });
      
      // Update settings
      await api.organizations.updateSettings(organization.id, orgSettings);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating organization:', err);
      setError('Failed to update organization settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSSO = async () => {
    if (!organization) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would update SSO settings
      await api.organizations.updateSSOSettings(organization.id, {
        enabled: ssoEnabled,
        provider: ssoProvider,
        domain: ssoDomain,
        clientId: ssoClientId,
        clientSecret: ssoClientSecret,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating SSO settings:', err);
      setError('Failed to update SSO settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInviteUser = async () => {
    if (!inviteEmail) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.users.inviteUser({
        email: inviteEmail,
        role: inviteRole,
        teamId: inviteTeamId || undefined,
      });
      
      // Refresh user list
      const usersResponse = await api.users.getUsers();
      setUsers(usersResponse.data);
      
      // Close dialog
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole(Role.VIEWER);
      setInviteTeamId('');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.users.removeUser(userId);
      
      // Refresh user list
      const usersResponse = await api.users.getUsers();
      setUsers(usersResponse.data);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };
  
  // Get user's highest role (organization-wide)
  const getUserHighestRole = (userId: string): Role | null => {
    const userOrgRoles = userRoles.filter(role => 
      role.userId === userId && !role.teamId
    );
    
    if (userOrgRoles.length === 0) return null;
    
    const roleHierarchy = ['VIEWER', 'DEVELOPER', 'MANAGER', 'ADMIN'];
    const sortedRoles = [...userOrgRoles].sort((a, b) => {
      return roleHierarchy.indexOf(b.role) - roleHierarchy.indexOf(a.role);
    });
    
    return sortedRoles[0].role as Role;
  };
  
  // Check if current user can manage this user
  const canManageUser = (userId: string): boolean => {
    // Can't manage yourself
    if (userId === organization?.id) return false;
    
    // Admins can manage everyone except other admins
    if (hasRole(['ADMIN'])) {
      const userRole = getUserHighestRole(userId);
      return userRole !== Role.ADMIN;
    }
    
    // Managers can only manage developers and viewers
    if (hasRole(['MANAGER'])) {
      const userRole = getUserHighestRole(userId);
      return userRole === Role.DEVELOPER || userRole === Role.VIEWER;
    }
    
    return false;
  };
  
  // Only admins and managers can access settings
  if (!hasPermission('organization', 'read')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access organization settings.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Organization Settings</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Changes saved successfully!
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="organization settings tabs"
          >
            <Tab 
              label="General" 
              id="settings-tab-0" 
              icon={<BusinessIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Users & Permissions" 
              id="settings-tab-1" 
              icon={<SupervisorAccountIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Single Sign-On" 
              id="settings-tab-2" 
              icon={<SecurityIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="SLA Configuration" 
              id="settings-tab-3" 
              icon={<NotificationsIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Domain Settings" 
              id="settings-tab-4" 
              icon={<DomainIcon />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>
        
        {/* General Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Organization Details</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Organization Name"
                fullWidth
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!hasPermission('organization', 'update') || loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Domain"
                fullWidth
                value={orgDomain}
                onChange={(e) => setOrgDomain(e.target.value)}
                disabled={!hasPermission('organization', 'update') || loading}
                helperText="Primary email domain for your organization (e.g., example.com)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Issue Settings</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={orgSettings.allowPublicIssues}
                    onChange={(e) => setOrgSettings(prev => ({
                      ...prev,
                      allowPublicIssues: e.target.checked
                    }))}
                    disabled={!hasPermission('organization', 'update') || loading}
                  />
                }
                label="Allow Public Issues"
              />
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                When enabled, issues can be made visible to users outside your organization.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!hasPermission('organization', 'update') || loading}>
                <InputLabel id="default-assignee-label">Default Assignment Policy</InputLabel>
                <Select
                  labelId="default-assignee-label"
                  value={orgSettings.defaultAssigneePolicy}
                  onChange={(e) => setOrgSettings(prev => ({
                    ...prev,
                    defaultAssigneePolicy: e.target.value as any
                  }))}
                  label="Default Assignment Policy"
                >
                  <MenuItem value="TEAM_LEAD">Team Lead</MenuItem>
                  <MenuItem value="ROUND_ROBIN">Round Robin</MenuItem>
                  <MenuItem value="MANUAL">Manual Assignment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              {hasPermission('organization', 'update') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveOrganization}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Users & Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Users & Permissions</Typography>
            
            {hasPermission('user', 'invite') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteDialogOpen(true)}
              >
                Invite User
              </Button>
            )}
          </Box>
          
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization Role</TableCell>
                    <TableCell>Team Roles</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(user => {
                    // Get user's organization-wide roles
                    const orgRoles = userRoles.filter(
                      role => role.userId === user.id && !role.teamId
                    );
                    
                    // Get user's team-specific roles
                    const teamRoles = userRoles.filter(
                      role => role.userId === user.id && role.teamId
                    );
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {orgRoles.map(role => (
                            <Chip 
                              key={role.id} 
                              label={role.role} 
                              size="small" 
                              color={
                                role.role === 'ADMIN' ? 'error' :
                                role.role === 'MANAGER' ? 'warning' :
                                role.role === 'DEVELOPER' ? 'primary' : 
                                'default'
                              }
                              sx={{ mr: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          {teamRoles.map(role => {
                            // Find team name
                            const team = teams.find(t => t.id === role.teamId);
                            return (
                              <Chip 
                                key={role.id} 
                                label={`${team?.name || role.teamId}: ${role.role}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            );
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {canManageUser(user.id) && (
                            <>
                              <IconButton 
                                color="primary" 
                                size="small"
                                onClick={() => {/* Open edit role dialog */}}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleRemoveUser(user.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Single Sign-On Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Single Sign-On (SSO) Configuration</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ssoEnabled}
                    onChange={(e) => setSsoEnabled(e.target.checked)}
                    disabled={!hasPermission('organization', 'update') || loading}
                  />
                }
                label="Enable SSO"
              />
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                When enabled, users can sign in using your organization's identity provider.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!ssoEnabled || !hasPermission('organization', 'update') || loading}>
                <InputLabel id="sso-provider-label">SSO Provider</InputLabel>
                <Select
                  labelId="sso-provider-label"
                  value={ssoProvider}
                  onChange={(e) => setSsoProvider(e.target.value)}
                  label="SSO Provider"
                >
                  <MenuItem value="google">Google Workspace</MenuItem>
                  <MenuItem value="azure">Microsoft Azure AD</MenuItem>
                  <MenuItem value="okta">Okta</MenuItem>
                  <MenuItem value="onelogin">OneLogin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Domain"
                fullWidth
                value={ssoDomain}
                onChange={(e) => setSsoDomain(e.target.value)}
                disabled={!ssoEnabled || !hasPermission('organization', 'update') || loading}
                helperText="The domain to validate email addresses against"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Client ID"
                fullWidth
                value={ssoClientId}
                onChange={(e) => setSsoClientId(e.target.value)}
                disabled={!ssoEnabled || !hasPermission('organization', 'update') || loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Secret"
                fullWidth
                type="password"
                value={ssoClientSecret}
                onChange={(e) => setSsoClientSecret(e.target.value)}
                disabled={!ssoEnabled || !hasPermission('organization', 'update') || loading}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              {hasPermission('organization', 'update') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveSSO}
                  disabled={loading}
                >
                  Save SSO Configuration
                </Button>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* SLA Configuration Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>SLA Configuration</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={orgSettings.supportSLA.enabled}
                    onChange={(e) => setOrgSettings(prev => ({
                      ...prev,
                      supportSLA: {
                        ...prev.supportSLA,
                        enabled: e.target.checked
                      }
                    }))}
                    disabled={!hasPermission('organization', 'update') || loading}
                  />
                }
                label="Enable SLA Tracking"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Default Response Time (hours)"
                type="number"
                fullWidth
                value={orgSettings.supportSLA.defaultResponseHours}
                onChange={(e) => setOrgSettings(prev => ({
                  ...prev,
                  supportSLA: {
                    ...prev.supportSLA,
                    defaultResponseHours: parseInt(e.target.value)
                  }
                }))}
                disabled={!orgSettings.supportSLA.enabled || !hasPermission('organization', 'update') || loading}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Default Resolution Time (hours)"
                type="number"
                fullWidth
                value={orgSettings.supportSLA.defaultResolutionHours}
                onChange={(e) => setOrgSettings(prev => ({
                  ...prev,
                  supportSLA: {
                    ...prev.supportSLA,
                    defaultResolutionHours: parseInt(e.target.value)
                  }
                }))}
                disabled={!orgSettings.supportSLA.enabled || !hasPermission('organization', 'update') || loading}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              {hasPermission('organization', 'update') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveOrganization}
                  disabled={loading}
                >
                  Save SLA Changes
                </Button>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Domain Settings Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>Domain Verification</Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" gutterBottom>
              Current domain: <strong>{orgDomain}</strong>
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    DNS Verification (recommended)
                  </Typography>
                  <Typography variant="body2">
                    Add the following TXT record to your DNS settings:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    my: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    fontFamily: 'monospace'
                  }}>
                    <Typography variant="body2">
                      Type: TXT<br />
                      Host: _buganizer-verification<br />
                      Value: buganizer-verify=abcdef123456
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    HTML File Verification
                  </Typography>
                  <Typography variant="body2">
                    Download and upload this HTML file to your web server root:
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    onClick={() => {/* Download verification file */}}
                  >
                    Download Verification File
                  </Button>
                </Paper>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              onClick={() => {/* Verify domain */}}
              disabled={loading}
            >
              Verify Domain
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>Additional Domains</Typography>
          
          <Typography variant="body2" paragraph>
            You can add additional domains that belong to your organization.
            Users with email addresses from these domains will be able to join your organization.
          </Typography>
          
          <TableContainer sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Domain</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Added On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{orgDomain}</TableCell>
                  <TableCell>
                    <Chip label="Primary" color="success" size="small" />
                  </TableCell>
                  <TableCell>N/A</TableCell>
                  <TableCell align="right">
                    <IconButton disabled>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {/* Additional domains would be listed here */}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {/* Open add domain dialog */}}
            disabled={!hasPermission('organization', 'update') || loading}
          >
            Add Domain
          </Button>
        </TabPanel>
      </Paper>
      
      {/* Invite User Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        aria-labelledby="invite-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="invite-dialog-title">Invite User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Email Address"
                type="email"
                fullWidth
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="invite-role-label">Role</InputLabel>
                <Select
                  labelId="invite-role-label"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  label="Role"
                >
                  {/* Only admins can create other admins */}
                  {hasRole(['ADMIN']) && (
                    <MenuItem value={Role.ADMIN}>Admin</MenuItem>
                  )}
                  <MenuItem value={Role.MANAGER}>Manager</MenuItem>
                  <MenuItem value={Role.DEVELOPER}>Developer</MenuItem>
                  <MenuItem value={Role.VIEWER}>Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="invite-team-label">Team (Optional)</InputLabel>
                <Select
                  labelId="invite-team-label"
                  value={inviteTeamId}
                  onChange={(e) => setInviteTeamId(e.target.value)}
                  label="Team (Optional)"
                >
                  <MenuItem value="">None - Organization Role Only</MenuItem>
                  {teams.map(team => (
                    <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleInviteUser}
            disabled={loading || !inviteEmail}
          >
            Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationSettings;