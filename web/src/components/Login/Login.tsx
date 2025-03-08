// src/components/Login/Login.tsx - Full solution

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

  // Handle redirection after successful authentication
  useEffect(() => {
    console.log("Login component: Auth state changed", { 
      isAuthenticated, 
      loading, 
      hasToken: !!localStorage.getItem('token') 
    });
    
    // Check for authentication, ensuring we're not in a loading state
    if (isAuthenticated && !loading) {
      console.log("Login component: Authentication detected, preparing to redirect...");
      
      // Add a small delay to ensure state updates are fully processed
      const redirectTimer = setTimeout(() => {
        console.log("Login component: Executing navigation to dashboard");
        
        // Use replace: true to prevent back button returning to login
        navigate('/dashboard', { replace: true });
        
        console.log("Login component: Navigation command issued");
      }, 300); // Slightly longer delay for more reliability
      
      // Clean up timer if component unmounts
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, loading, navigate]);
  
  // Add a separate effect to check for token directly
  // This is a fallback in case the auth state doesn't update properly
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log("Login component: Token check", { hasToken: !!token });
    
    if (token && !isAuthenticated) {
      console.log("Login component: Token exists but auth state not updated, manually forcing reload");
      // Force a reload as a fallback (this ensures a clean state)
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  const debugAuthState = () => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    let user = null;
    
    try {
      if (userString) {
        user = JSON.parse(userString);
      }
    } catch (e) {
      console.error("Failed to parse user data", e);
    }
    
    console.log("=== Auth State Debug ===");
    console.log("Local Storage:", { 
      hasToken: !!token, 
      tokenPrefix: token ? token.substring(0, 10) + '...' : null,
      hasUser: !!user,
      user: user ? `${user.name} (${user.email})` : null
    });
    console.log("Auth Context:", { 
      isAuthenticated, 
      loading, 
      hasUser: !!user, 
      error 
    });
    console.log("=== End Debug ===");
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setLocalError(null);
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("Login component: Google login initiated");
      setLocalError(null);
      
      // Show loading indicator
      setLocalLoading(true);
      
      // In a real implementation, this would integrate with Google OAuth
      // For now, we'll just simulate it with a fake token
      await loginWithGoogle('fake_google_token');
      console.log("Login component: Google login successful");
      
      // Don't navigate here - let the useEffect handle it
      // The redirection will happen automatically via useEffect
    } catch (err) {
      console.error('Login component: Google login error:', err);
      setLocalError('Failed to log in with Google. Please try again.');
      setLocalLoading(false);
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login component: Form submitted");
    
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
      console.log(`Login component: Logging in with email: ${email}`);
      
      // Use the auth hook's loginWithCredentials method
      await loginWithCredentials(email, password);
      console.log("Login component: Credentials accepted");
      
      // Don't navigate here - let the useEffect handle it
      // The redirection will happen automatically via useEffect
    } catch (err) {
      console.error('Login component: Login failed:', err);
      setLocalError('Login failed. Please check your credentials and try again.');
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

                {/* Display authentication errors from useAuth */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

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
                  {localError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {localError}
                    </Alert>
                  )}

                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={localLoading || loading ? <CircularProgress size={20} /> : <GoogleIcon />}
                    onClick={handleGoogleLogin}
                    disabled={localLoading || loading}
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
                      disabled={localLoading || loading}
                      sx={{ py: 1.5, mb: 2 }}
                    >
                      {localLoading || loading ? <CircularProgress size={24} /> : 'Sign In'}
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