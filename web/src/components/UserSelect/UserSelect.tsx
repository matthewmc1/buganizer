// src/components/UserSelect/UserSelect.tsx
import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Avatar, 
  Typography, 
  Box,
  CircularProgress,
} from '@mui/material';
import { User } from '../../types/users';

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  sx?: any;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  label = 'Assignee',
  placeholder = 'Select user',
  fullWidth = false,
  required = false,
  disabled = false,
  multiple = false,
  sx = {},
}) => {
  const [options, setOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch from API
        // const response = await api.users.getUsers();
        // setOptions(response.data);
        
        // For development/demo, use mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockUsers: User[] = [
          {
            id: 'user-1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            googleId: 'john123',
            avatarUrl: 'https://i.pravatar.cc/150?u=john',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-2',
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            googleId: 'jane456',
            avatarUrl: 'https://i.pravatar.cc/150?u=jane',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-3',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            googleId: 'bob789',
            avatarUrl: 'https://i.pravatar.cc/150?u=bob',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        
        setOptions(mockUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const getSelectedUser = () => {
    if (!value) return null;
    return options.find(user => user.id === value) || null;
  };

  return (
    <Autocomplete
      value={getSelectedUser()}
      onChange={(_, newValue) => {
        onChange(newValue ? newValue.id : '');
      }}
      options={options}
      getOptionLabel={(option) => option.name}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          sx={sx}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={option.avatarUrl}
              alt={option.name}
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              {option.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2">
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.email}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
    />
  );
};

export default UserSelect;