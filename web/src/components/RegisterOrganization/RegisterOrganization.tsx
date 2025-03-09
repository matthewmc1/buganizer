// src/components/RegisterOrganization/RegisterOrganization.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Container,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Business as BusinessIcon } from '@mui/icons-material';
import api from '../../utils/api';

const RegisterOrganization: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Register organization and admin user
      await api.auth.register({
        organizationName: orgName,
        domain: orgDomain,
        name,
        email,
        password,
      });
      
      // Navigate to success page
      navigate('/register/success');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Stepper navigation
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate organization step
      if (!orgName) {
        setError('Organization name is required');
        return;
      }
      if (!orgDomain) {
        setError('Domain is required');
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setError(null);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };
  
  const steps = ['Organization Details', 'Admin Account'];
  
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <BusinessIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Buganizer
          </Typography>
        </Box>
        
        <Typography variant="h5" align="center" gutterBottom>
          Register Your Organization
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4 }}>
          Create a new organization and admin account
        </Typography>
        
        <Paper sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {activeStep === 0 ? (
              // Organization Step
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Organization Name"
                    fullWidth
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    autoFocus
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Domain"
                    fullWidth
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                    required
                    helperText="Primary email domain for your organization (e.g., example.com)"
                  />
                </Grid>
              </Grid>
            ) : (
              // Admin Account Step
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    helperText="This will be the admin account for your organization"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    helperText="At least 8 characters"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                  >
                    Register
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account? <RouterLink to="/login">Sign in</RouterLink>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterOrganization;