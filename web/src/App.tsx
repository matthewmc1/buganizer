// web/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMediaQuery } from '@mui/material';

// Components
import Layout from './components/Layout/Layout';
import IssueList from './components/IssueList/IssueList';
import IssueDetail from './components/IssueDetail/IssueDetail';
import CreateIssue from './components/CreateIssue/CreateIssue';
import Login from './components/Login/Login';
import NotFound from './components/NotFound/NotFound';

// Auth
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { isAuthenticated, loading } = useAuth();

  // Create a theme instance
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(','),
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
        },
      }),
    [prefersDarkMode]
  );

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
            isAuthenticated ? <Navigate to="/" /> : <Login />
          } />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/issues" />} />
              <Route path="/issues" element={<IssueList />} />
              <Route path="/issues/new" element={<CreateIssue />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
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