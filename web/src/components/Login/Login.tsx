// src/components/Login/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  Container,
  TextField,
  Divider,
  Tab,
  Tabs,
  useTheme,
  Card,
  CardContent,
  Grid,
  alpha,
  Stack,
} from '@mui/material';
import { Google as GoogleIcon, BugReport as BugReportIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

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
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { loginWithGoogle, loginWithCredentials, isAuthenticated, loading, error } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Local login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/issues', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setLocalError(null);
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      // In a real implementation, this would integrate with Google OAuth
      // For now, we'll just simulate it with a fake token
      await loginWithGoogle('fake_google_token');
      navigate('/issues', { replace: true });
    } catch (err) {
      setLocalError('Failed to log in with Google. Please try again.');
      console.error('Google login error:', err);
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email) {
      setLocalError('Email is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);
    
    try {
      // Use the auth hook's loginWithCredentials method
      await loginWithCredentials(email, password);
      // Successful login, navigate to issues dashboard
      navigate('/issues', { replace: true });
    } catch (err) {
      setLocalError('Login failed. Please check your credentials and try again.');
      console.error('Local login error:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  // Predefined developer accounts for easy testing
  const predefinedAccounts = [
    { email: 'admin@buganizer.dev', role: 'Admin' },
    { email: 'developer@buganizer.dev', role: 'Developer' },
    { email: 'manager@buganizer.dev', role: 'Manager' },
    { email: 'tester@buganizer.dev', role: 'QA Tester' },
  ];

  const handleQuickLogin = (email: string) => {
    setEmail(email);
    setPassword('password'); // Set a default password
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 35%, ${alpha(theme.palette.primary.light, 0.8)} 100%)`,
      }}
    >
      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Grid container spacing={0} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6} sx={{ p: 3, display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ color: 'white', p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <BugReportIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h4" component="h1" fontWeight="bold" sx={{ letterSpacing: -0.5 }}>
                  Buganizer
                </Typography>
              </Box>
              
              <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Track, manage and resolve issues efficiently
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Your complete solution for issue tracking, SLA management and team collaboration
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                {['Real-time updates', 'SLA monitoring', 'Integrations', 'Advanced search', 'Custom workflows'].map((feature) => (
                  <Box 
                    key={feature}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.15)', 
                      px: 2, 
                      py: 1, 
                      borderRadius: 5,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ p: { xs: 2, md: 3 } }}>
            <Card 
              elevation={24}
              sx={{ 
                maxWidth: 500, 
                mx: 'auto', 
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                overflow: 'visible',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 3, display: { xs: 'block', md: 'none' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BugReportIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                    <Typography variant="h5" component="h1" fontWeight="bold" color="primary" sx={{ letterSpacing: -0.5 }}>
                      Buganizer
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom align="center">
                  Welcome back
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Sign in to your account to continue
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="login methods" 
                    centered
                    variant="fullWidth"
                    sx={{
                      '& .MuiTab-root': {
                        fontWeight: 600,
                        textTransform: 'none',
                      },
                    }}
                  >
                    <Tab label="Google Login" id="login-tab-0" />
                    <Tab label="Developer Login" id="login-tab-1" />
                  </Tabs>
                </Box>

                {/* Google Login Tab */}
                <TabPanel value={tabValue} index={0}>
                  {(error || localError) && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error || localError}
                    </Alert>
                  )}

                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    sx={{ 
                      py: 1.5,
                      backgroundColor: 'white',
                      borderColor: '#ddd',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: '#f9f9f9',
                      }
                    }}
                  >
                    Sign in with Google
                  </Button>
                </TabPanel>

                {/* Developer Login Tab */}
                <TabPanel value={tabValue} index={1}>
                  {localError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {localError}
                    </Alert>
                  )}
                  
                  <form onSubmit={handleLocalLogin}>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      margin="normal"
                      variant="outlined"
                      required
                      autoComplete="email"
                    />
                    
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      margin="normal"
                      variant="outlined"
                      required
                      autoComplete="current-password"
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      type="submit"
                      disabled={localLoading}
                      sx={{ py: 1.5, mb: 2 }}
                    >
                      {localLoading ? <CircularProgress size={24} /> : 'Sign In'}
                    </Button>
                  </form>
                  
                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Quick Access
                    </Typography>
                  </Divider>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sample accounts (use any password):
                  </Typography>
                  
                  <Stack spacing={1}>
                    {predefinedAccounts.map((account) => (
                      <Button
                        key={account.email}
                        variant="outlined"
                        size="small"
                        onClick={() => handleQuickLogin(account.email)}
                        sx={{ justifyContent: 'space-between' }}
                      >
                        <Typography variant="body2">{account.email}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.role}
                        </Typography>
                      </Button>
                    ))}
                  </Stack>
                </TabPanel>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;