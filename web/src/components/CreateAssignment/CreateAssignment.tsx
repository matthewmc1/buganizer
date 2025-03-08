// src/components/CreateAssignment/CreateAssignment.tsx
import React, { useState, useEffect } from 'react';
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
  Alert,
  Divider,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { AssignmentStatus } from '../../types/assignments';
import { Priority } from '../../types/issues';
import { Team } from '../../types/users';
import api from '../../utils/api';
import UserSelect from '../UserSelect/UserSelect';
import { useAssignments } from '../../hooks/useAssignments';
import { useAuth } from '../../hooks/useAuth';

// Interface for customer information
interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
}

// Interface for component with SLA configuration
interface ComponentWithSLA {
  id: string;
  name: string;
  description: string;
  slaConfig: {
    id: string;
    criticalResponseTime: number;
    highResponseTime: number;
    mediumResponseTime: number;
    lowResponseTime: number;
    criticalResolutionTime: number;
    highResolutionTime: number;
    mediumResolutionTime: number;
    lowResolutionTime: number;
  } | null;
}

const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { createAssignment } = useAssignments();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [components, setComponents] = useState<ComponentWithSLA[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showComponentSLAForm, setShowComponentSLAForm] = useState(false);
  const [selectedComponentForSLA, setSelectedComponentForSLA] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: AssignmentStatus.PLANNING,
    priority: Priority.P2, // Default to Medium
    teamId: '',
    leadId: '',
    startDate: new Date().toISOString(),
    targetDate: '',
    selectedComponents: [] as ComponentWithSLA[],
    selectedCustomers: [] as Customer[],
  });

  // For customer form
  const [customerFormData, setCustomerFormData] = useState({
    id: '',
    name: '',
    email: '',
    company: '',
    impact: 'ENHANCEMENT',
    notes: '',
  });

  // For SLA form
  const [slaFormData, setSlaFormData] = useState({
    criticalResponseTime: 1, // Hours
    highResponseTime: 4,
    mediumResponseTime: 8,
    lowResponseTime: 24,
    criticalResolutionTime: 8,
    highResolutionTime: 24,
    mediumResolutionTime: 72,
    lowResolutionTime: 168,
  });

  // Fetch teams and components on mount
  useEffect(() => {
    const fetchTeamsAndComponents = async () => {
      setLoading(true);
      try {
        // Fetch teams
        const teamsResponse = await api.teams.getTeams();
        setTeams(teamsResponse.data);

        // Fetch components
        const componentsResponse = await api.components.getComponents();
        setComponents(componentsResponse.data);

        // Fetch customers (mock for now)
        // In a real app, you would have an API endpoint for this
        const mockCustomers: Customer[] = [
          { id: 'cust-1', name: 'Acme Inc', email: 'contact@acme.com', company: 'Acme Inc' },
          { id: 'cust-2', name: 'Globex Corp', email: 'info@globex.com', company: 'Globex Corporation' },
          { id: 'cust-3', name: 'Initech', email: 'support@initech.com', company: 'Initech' },
          { id: 'cust-4', name: 'Umbrella Corp', email: 'info@umbrella.com', company: 'Umbrella Corporation' },
        ];
        setCustomers(mockCustomers);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch teams and components. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamsAndComponents();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleDateChange = (date: Date | null, field: string) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date.toISOString()
      }));
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSLAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSlaFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  const handleAddCustomer = () => {
    if (!customerFormData.id) {
      setError('Please select a customer');
      return;
    }

    // Check if customer is already added
    const alreadyAdded = formData.selectedCustomers.some(
      c => c.id === customerFormData.id
    );

    if (alreadyAdded) {
      setError('This customer is already added to the assignment');
      return;
    }

    // Find the customer details
    const customerDetails = customers.find(c => c.id === customerFormData.id);
    if (!customerDetails) {
      setError('Customer not found');
      return;
    }

    // Add customer to the list
    setFormData(prev => ({
      ...prev,
      selectedCustomers: [...prev.selectedCustomers, customerDetails]
    }));

    // Reset form
    setCustomerFormData({
      id: '',
      name: '',
      email: '',
      company: '',
      impact: 'ENHANCEMENT',
      notes: '',
    });

    setShowCustomerForm(false);
  };

  const handleRemoveCustomer = (customerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCustomers: prev.selectedCustomers.filter(c => c.id !== customerId)
    }));
  };

  const handleAddComponent = (componentId: string) => {
    if (!componentId) return;

    // Find the component details
    const componentDetails = components.find(c => c.id === componentId);
    if (!componentDetails) {
      setError('Component not found');
      return;
    }

    // Check if component is already added
    const alreadyAdded = formData.selectedComponents.some(
      c => c.id === componentId
    );

    if (alreadyAdded) {
      setError('This component is already added to the assignment');
      return;
    }

    // Add component to the list
    setFormData(prev => ({
      ...prev,
      selectedComponents: [...prev.selectedComponents, componentDetails]
    }));

    // Show SLA form for this component
    setSelectedComponentForSLA(componentId);
    setShowComponentSLAForm(true);
  };

  const handleSaveSLA = () => {
    // Find the component in the selected components
    const updatedComponents = formData.selectedComponents.map(component => {
      if (component.id === selectedComponentForSLA) {
        // Create a new SLA config for this component
        return {
          ...component,
          slaConfig: {
            id: `sla-${Date.now()}`, // Temporary ID
            ...slaFormData
          }
        };
      }
      return component;
    });

    setFormData(prev => ({
      ...prev,
      selectedComponents: updatedComponents
    }));

    setShowComponentSLAForm(false);
    setSelectedComponentForSLA('');
    
    // Reset SLA form to defaults
    setSlaFormData({
      criticalResponseTime: 1,
      highResponseTime: 4,
      mediumResponseTime: 8,
      lowResponseTime: 24,
      criticalResolutionTime: 8,
      highResolutionTime: 24,
      mediumResolutionTime: 72,
      lowResolutionTime: 168,
    });
  };

  const handleConfigureSLA = (componentId: string) => {
    // Find existing SLA config if any
    const component = formData.selectedComponents.find(c => c.id === componentId);
    if (component && component.slaConfig) {
      setSlaFormData(component.slaConfig);
    } else {
      // Reset to defaults
      setSlaFormData({
        criticalResponseTime: 1,
        highResponseTime: 4,
        mediumResponseTime: 8,
        lowResponseTime: 24,
        criticalResolutionTime: 8,
        highResolutionTime: 24,
        mediumResolutionTime: 72,
        lowResolutionTime: 168,
      });
    }
    
    setSelectedComponentForSLA(componentId);
    setShowComponentSLAForm(true);
  };

  const handleRemoveComponent = (componentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedComponents: prev.selectedComponents.filter(c => c.id !== componentId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate form
    if (!formData.title) {
      setError('Title is required');
      setLoading(false);
      return;
    }
    
    if (!formData.teamId) {
      setError('Team is required');
      setLoading(false);
      return;
    }
    
    if (!formData.leadId) {
      setError('Technical Lead is required');
      setLoading(false);
      return;
    }
    
    try {
      // Prepare data for API
      const assignmentData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        teamId: formData.teamId,
        leadId: formData.leadId,
        startDate: formData.startDate,
        targetDate: formData.targetDate || undefined,
        componentIds: formData.selectedComponents.map(c => c.id),
        customerId: formData.selectedCustomers.map(c => c.id),
        // Also include the SLA configurations
        componentSLAs: formData.selectedComponents.map(c => ({
          componentId: c.id,
          slaConfig: c.slaConfig
        })),
      };
      
      await createAssignment(assignmentData);
      setSuccess(true);
      
      // Navigate to the assignments list after a brief delay
      setTimeout(() => {
        navigate('/assignments');
      }, 1500);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError('Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create New Assignment</Typography>
      
      <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
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
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                {Object.values(AssignmentStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
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
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider>
                <DatePicker
                  label="Start Date"
                  value={new Date(formData.startDate)}
                  onChange={(date) => handleDateChange(date, 'startDate')}
                  disabled={loading}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider>
                <DatePicker
                  label="Target Date"
                  value={formData.targetDate ? new Date(formData.targetDate) : null}
                  onChange={(date) => handleDateChange(date, 'targetDate')}
                  disabled={loading}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Team and Lead */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Assignment Ownership</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Team"
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                disabled={loading || teams.length === 0}
                required
                helperText={teams.length === 0 ? "Loading teams..." : ""}
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <UserSelect
                value={formData.leadId}
                onChange={(value) => setFormData(prev => ({ ...prev, leadId: value }))}
                label="Technical Lead"
                required
                fullWidth
              />
            </Grid>
            
            {/* Components & SLAs */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Components & SLAs</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Autocomplete
                  options={components.filter(c => 
                    !formData.selectedComponents.some(sc => sc.id === c.id)
                  )}
                  getOptionLabel={(option) => option.name}
                  sx={{ minWidth: 300 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Add Component"
                      fullWidth
                    />
                  )}
                  onChange={(_, value) => value && handleAddComponent(value.id)}
                  disabled={loading || components.length === 0}
                />
              </Box>
              
              {formData.selectedComponents.length > 0 && (
                <List sx={{ mt: 2 }}>
                  {formData.selectedComponents.map((component) => (
                    <Card key={component.id} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Grid container alignItems="center">
                          <Grid item xs={8}>
                            <Typography variant="subtitle1">{component.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {component.description}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ textAlign: 'right' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleConfigureSLA(component.id)}
                              sx={{ mr: 1 }}
                            >
                              {component.slaConfig ? 'Edit SLA' : 'Set SLA'}
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveComponent(component.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Grid>
                          {component.slaConfig && (
                            <Grid item xs={12}>
                              <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  SLA: Critical: {component.slaConfig.criticalResponseTime}h response / {component.slaConfig.criticalResolutionTime}h resolution | 
                                  High: {component.slaConfig.highResponseTime}h / {component.slaConfig.highResolutionTime}h | 
                                  Medium: {component.slaConfig.mediumResponseTime}h / {component.slaConfig.mediumResolutionTime}h
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              )}
            </Grid>
            
            {/* Customers */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Impacted Customers</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              {!showCustomerForm ? (
                <Button
                  variant="outlined"
                  startIcon={<BusinessIcon />}
                  onClick={() => setShowCustomerForm(true)}
                  disabled={loading}
                >
                  Add Customer
                </Button>
              ) : (
                <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Customer"
                        name="id"
                        value={customerFormData.id}
                        onChange={handleCustomerChange}
                        disabled={loading || customers.length === 0}
                        required
                      >
                        {customers
                          .filter(c => !formData.selectedCustomers.some(sc => sc.id === c.id))
                          .map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.company})
                            </MenuItem>
                          ))}
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Impact"
                        name="impact"
                        value={customerFormData.impact}
                        onChange={handleCustomerChange}
                        disabled={loading}
                      >
                        <MenuItem value="BLOCKER">Blocker - Customer completely blocked</MenuItem>
                        <MenuItem value="MAJOR">Major - Major functionality affected</MenuItem>
                        <MenuItem value="MINOR">Minor - Minor functionality affected</MenuItem>
                        <MenuItem value="ENHANCEMENT">Enhancement - Feature request</MenuItem>
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label="Notes"
                        name="notes"
                        value={customerFormData.notes}
                        onChange={handleCustomerChange}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setShowCustomerForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAddCustomer}
                        disabled={loading || !customerFormData.id}
                      >
                        Add Customer
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {formData.selectedCustomers.length > 0 && (
                <List sx={{ mt: 2 }}>
                  {formData.selectedCustomers.map((customer) => (
                    <ListItem
                      key={customer.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveCustomer(customer.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={customer.name}
                        secondary={`${customer.company} | ${customer.email}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/assignments')}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading || !formData.title || !formData.teamId || !formData.leadId}
                startIcon={loading && <CircularProgress size={24} />}
              >
                Create Assignment
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* SLA Configuration Dialog */}
      {showComponentSLAForm && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 600,
            p: 3,
            zIndex: 1300,
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Configure SLA for {
              components.find(c => c.id === selectedComponentForSLA)?.name
            }
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Response Time (hours)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Critical"
                name="criticalResponseTime"
                type="number"
                value={slaFormData.criticalResponseTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 72 } }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="High"
                name="highResponseTime"
                type="number"
                value={slaFormData.highResponseTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 72 } }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Medium"
                name="mediumResponseTime"
                type="number"
                value={slaFormData.mediumResponseTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 72 } }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Low"
                name="lowResponseTime"
                type="number"
                value={slaFormData.lowResponseTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 72 } }}
              />
            </Grid>
          </Grid>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Resolution Time (hours)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Critical"
                name="criticalResolutionTime"
                type="number"
                value={slaFormData.criticalResolutionTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 168 } }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="High"
                name="highResolutionTime"
                type="number"
                value={slaFormData.highResolutionTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 168 } }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Medium"
                name="mediumResolutionTime"
                type="number"
                value={slaFormData.mediumResolutionTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 168 } }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Low"
                name="lowResolutionTime"
                type="number"
                value={slaFormData.lowResolutionTime}
                onChange={handleSLAChange}
                InputProps={{ inputProps: { min: 1, max: 168 } }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setShowComponentSLAForm(false);
                setSelectedComponentForSLA('');
              }}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveSLA}
            >
              Save SLA Configuration
            </Button>
          </Box>
        </Paper>
      )}
      
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success">Assignment created successfully!</Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateAssignment;