// src/App.tsx - Updated theme
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Dashboard from './components/Dashboard/Dashboard';
import Layout from './components/Layout/Layout';
import IssueList from './components/IssueList/IssueList';
import IssueDetail from './components/IssueDetail/IssueDetail';
import CreateIssue from './components/CreateIssue/CreateIssue';
import Login from './components/Login/Login';
import AssignmentDetail from './components/AssignmentDetail/AssignmentDetail';
import AssignmentList from './components/AssignmentList/AssignmentList';
import NotFound from './components/NotFound/NotFound';

// Auth
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import CreateAssignment from './components/CreateAssignment/CreateAssignment';
import OrganizationSettings from './components/OrganizationSettings/OrganizationSettings';
import RegisterOrganization from './components/RegisterOrganization/RegisterOrganization';
import TeamsList from './components/TeamsList/TeamsList';
import TeamDetail from './components/TeamDetail/TeamDetail';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Create a modern theme with better aesthetics
  let theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#3a86ff', // A vibrant blue that's more engaging
        light: '#6ba2ff',
        dark: '#0a5dc7',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ff6b6b', // A soft red for accents
        light: '#ff9b9b',
        dark: '#c73a3a',
      },
      background: {
        default: '#f8fafc', // Very light blue-gray for background
        paper: '#ffffff',
      },
      error: {
        main: '#ef4444',
      },
      warning: {
        main: '#f59e0b',
      },
      info: {
        main: '#3b82f6',
      },
      success: {
        main: '#10b981',
      },
      text: {
        primary: '#1e293b', // Darker text for better readability
        secondary: '#64748b', // Medium gray for secondary text
      },
      divider: 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none', // Avoid all-caps buttons for a more modern look
      },
    },
    shape: {
      borderRadius: 8, // Slightly more rounded corners
    },
    shadows: [
      'none',
      '0px 1px 2px rgba(0, 0, 0, 0.05)',
      '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
      '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
      'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 
      'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
          },
          contained: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          },
          elevation1: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });

  // Make fonts responsive
  theme = responsiveFontSizes(theme);

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />
          <Route path="/register" element={<RegisterOrganization />} />
          
          {/* Protected routes - must be authenticated */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} />}>
            <Route element={<Layout />}>
              {/* Default route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Main routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/issues" element={<IssueList />} />
              <Route path="/issues/new" element={<CreateIssue />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
              <Route path='/assignments' element={<AssignmentList />} />
              <Route path='/assignments/:id' element={<AssignmentDetail />} />
              <Route path='/assignments/new' element={<CreateAssignment />} />
              
              {/* Organization management */}
              <Route path='/settings/organization' element={<OrganizationSettings />} />
              
              {/* Team management */}
              <Route path='/teams' element={<TeamsList />} />
              <Route path='/teams/:id' element={<TeamDetail />} />
            </Route>
          </Route>
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;