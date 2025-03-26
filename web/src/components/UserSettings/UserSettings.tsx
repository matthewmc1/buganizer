// src/components/UserSettings/UserSettings.tsx
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
  Avatar,
  Chip,
  useTheme,
  alpha,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  SupervisedUserCircle as RoleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../utils/api';
import { NotificationType } from '../../types/notifications';

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

const UserSettings: React.FC = () => {
  const theme = useTheme();
  const { user, organization } = useAuth();
  const { hasPermission, getHighestRole } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User profile settings
  const [name, setName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  
  // Notification settings
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [subscribedEvents, setSubscribedEvents] = useState<NotificationType[]>([
    NotificationType.ISSUE_ASSIGNED,
    NotificationType.COMMENT_ADDED,
    NotificationType.SLA_AT_RISK,
  ]);
  
  // Admin settings (Slack integration)
  const [slackToken, setSlackToken] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [slackEnabled, setSlackEnabled] = useState(false);
  
  // Load user data and settings
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Set base profile info from user object
        setName(user.name);
        setProfileEmail(user.email);
        setNotificationEmail(user.email);
        
        // In a real implementation, we'd fetch additional settings from API
        // For now, simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock notification preferences
        setEmailNotifications(true);
        setBrowserNotifications(true);
        setSubscribedEvents([
          NotificationType.ISSUE_ASSIGNED,
          NotificationType.COMMENT_ADDED,
          NotificationType.SLA_AT_RISK,
        ]);
        
        // If admin, load Slack integration settings
        if (hasPermission('settings', 'update')) {
          setSlackEnabled(false);
          setSlackToken('');
          setSlackChannel('#incidents');
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user, hasPermission]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would update the user profile via API
      // api.users.updateUser(user.id, { name });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would update notification preferences via API
      // api.notifications.updateNotificationPreferences({
      //   emailNotifications,
      //   browserNotifications,
      //   subscribedEvents,
      //   notificationEmail
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSlackIntegration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would update Slack integration settings via API
      // api.integrations.updateSlackIntegration({
      //   enabled: slackEnabled,
      //   token: slackToken,
      //   channel: slackChannel
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating Slack integration:', err);
      setError('Failed to update Slack integration');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleNotificationType = (type: NotificationType) => {
    setSubscribedEvents(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Check if user is admin
  const isAdmin = hasPermission('settings', 'update');
  const userRole = getHighestRole();
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        User Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* User info sidebar */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
              <Avatar
                src={user.avatarUrl}
                sx={{ 
                  width: 96, 
                  height: 96, 
                  mx: 'auto', 
                  mb: 2,
                  border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              
              <Chip 
                label={userRole || 'User'} 
                color={
                  userRole === 'ADMIN' ? 'error' :
                  userRole === 'MANAGER' ? 'warning' :
                  userRole === 'DEVELOPER' ? 'primary' : 
                  'default'
                }
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Organization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {organization?.name || 'Not available'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Domain
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {organization?.domain || 'Not available'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Account Created
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Settings tabs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="settings tabs"
              >
                <Tab 
                  label="Profile" 
                  id="settings-tab-0" 
                  icon={<PersonIcon />} 
                  iconPosition="start" 
                />
                <Tab 
                  label="Notifications" 
                  id="settings-tab-1" 
                  icon={<NotificationsIcon />} 
                  iconPosition="start" 
                />
                {isAdmin && (
                  <Tab 
                    label="Integrations" 
                    id="settings-tab-2" 
                    icon={<BackupIcon />} 
                    iconPosition="start" 
                  />
                )}
              </Tabs>
            </Box>
            
            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>Profile Information</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Name"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={profileEmail}
                    InputProps={{ readOnly: true }}
                    helperText="This is your login email"
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Avatar URL"
                    fullWidth
                    value={user.avatarUrl || ''}
                    onChange={(e) => {/* Would update avatar URL */}}
                    disabled={loading}
                    helperText="URL for your avatar image"
                  />
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    Save Profile
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Notification Email"
                    fullWidth
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    disabled={loading}
                    helperText="Email address for notifications"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Email Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={browserNotifications}
                        onChange={(e) => setBrowserNotifications(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Browser Notifications"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Notification Types
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Select which events you want to be notified about:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label="Issue Created"
                      clickable
                      color={subscribedEvents.includes(NotificationType.ISSUE_CREATED) ? 'primary' : 'default'}
                      onClick={() => handleToggleNotificationType(NotificationType.ISSUE_CREATED)}
                      variant={subscribedEvents.includes(NotificationType.ISSUE_CREATED) ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="Issue Updated"
                      clickable
                      color={subscribedEvents.includes(NotificationType.ISSUE_UPDATED) ? 'primary' : 'default'}
                      onClick={() => handleToggleNotificationType(NotificationType.ISSUE_UPDATED)}
                      variant={subscribedEvents.includes(NotificationType.ISSUE_UPDATED) ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="Issue Assigned"
                      clickable
                      color={subscribedEvents.includes(NotificationType.ISSUE_ASSIGNED) ? 'primary' : 'default'}
                      onClick={() => handleToggleNotificationType(NotificationType.ISSUE_ASSIGNED)}
                      variant={subscribedEvents.includes(NotificationType.ISSUE_ASSIGNED) ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="Comment Added"
                      clickable
                      color={subscribedEvents.includes(NotificationType.COMMENT_ADDED) ? 'primary' : 'default'}
                      onClick={() => handleToggleNotificationType(NotificationType.COMMENT_ADDED)}
                      variant={subscribedEvents.includes(NotificationType.COMMENT_ADDED) ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="SLA At Risk"
                      clickable
                      color={subscribedEvents.includes(NotificationType.SLA_AT_RISK) ? 'primary' : 'default'}
                      onClick={() => handleToggleNotificationType(NotificationType.SLA_AT_RISK)}
                      variant={subscribedEvents.includes(NotificationType.SLA_AT_RISK) ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="SLA Breached"
                      clickable
                      color={subscribedEvents.includes(NotificationType.SLA_BREACHED) ? 'primary' : 'default'}
                      onClick={() => handleToggleNotificationType(NotificationType.SLA_BREACHED)}
                      variant={subscribedEvents.includes(NotificationType.SLA_BREACHED) ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveNotifications}
                    disabled={loading}
                  >
                    Save Notification Settings
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Admin - Integrations Tab */}
            {isAdmin && (
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>Slack Integration</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure Slack integration for incident alerts and notifications.
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={slackEnabled}
                          onChange={(e) => setSlackEnabled(e.target.checked)}
                          disabled={loading}
                        />
                      }
                      label="Enable Slack Integration"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Slack Token"
                      fullWidth
                      value={slackToken}
                      onChange={(e) => setSlackToken(e.target.value)}
                      disabled={loading || !slackEnabled}
                      type="password"
                      helperText="Bot token for Slack API (xoxb-...)"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Slack Channel"
                      fullWidth
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      disabled={loading || !slackEnabled}
                      helperText="Channel for alerts (e.g. #incidents)"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      onClick={handleSaveSlackIntegration}
                      disabled={loading || !slackEnabled}
                    >
                      Save Slack Settings
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserSettings;