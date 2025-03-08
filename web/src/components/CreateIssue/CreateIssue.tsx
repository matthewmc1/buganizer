// src/components/CreateIssue/CreateIssue.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  MenuItem, 
  CircularProgress,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import { Priority, Severity } from '../../types/issues';
import api from '../../utils/api';

const CreateIssue: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reproduceSteps: '',
    componentId: '',
    priority: Priority.P2, // Default to Medium
    severity: Severity.S2, // Default to Moderate
    labels: [] as string[],
  });
  
  const [components, setComponents] = useState([]);
  
  // Fetch components on mount
  React.useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await api.components.getComponents();
        setComponents(response.data);
      } catch (err) {
        console.error('Error fetching components:', err);
      }
    };
    
    fetchComponents();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.issues.createIssue(formData);
      setSuccess(true);
      
      // Navigate to the new issue after a brief delay
      setTimeout(() => {
        navigate(`/issues/${response.data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating issue:', err);
      setError('Failed to create issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create New Issue</Typography>
      
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Steps to Reproduce"
                name="reproduceSteps"
                value={formData.reproduceSteps}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Component"
                name="componentId"
                value={formData.componentId}
                onChange={handleChange}
                disabled={loading || components.length === 0}
                helperText={components.length === 0 ? "Loading components..." : ""}
              >
                {components.map((component: any) => (
                  <MenuItem key={component.id} value={component.id}>
                    {component.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value={Priority.P0}>P0 - Critical</MenuItem>
                <MenuItem value={Priority.P1}>P1 - High</MenuItem>
                <MenuItem value={Priority.P2}>P2 - Medium</MenuItem>
                <MenuItem value={Priority.P3}>P3 - Low</MenuItem>
                <MenuItem value={Priority.P4}>P4 - Trivial</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value={Severity.S0}>S0 - Critical</MenuItem>
                <MenuItem value={Severity.S1}>S1 - Major</MenuItem>
                <MenuItem value={Severity.S2}>S2 - Moderate</MenuItem>
                <MenuItem value={Severity.S3}>S3 - Minor</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Labels (comma separated)"
                name="labels"
                value={formData.labels.join(',')}
                onChange={(e) => {
                  const labels = e.target.value.split(',').map(label => label.trim()).filter(Boolean);
                  setFormData(prev => ({ ...prev, labels }));
                }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/issues')}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading || !formData.title || !formData.componentId}
                startIcon={loading && <CircularProgress size={24} />}
              >
                Create Issue
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success">Issue created successfully!</Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateIssue;