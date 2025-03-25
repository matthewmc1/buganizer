// src/components/Layout/Layout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem,
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  useTheme,
  useMediaQuery,
  Avatar,
  Tooltip,
  Badge,
  alpha,
  Container,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  BugReport as BugReportIcon, 
  Group as GroupIcon, 
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  ExitToApp as LogoutIcon,
  ViewList as ViewListIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };
  
  const handleLogoutClick = () => {
    handleProfileClose(); // Close profile menu
    setLogoutDialogOpen(true); // Open confirmation dialog
  };
  
  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout();
    // Force navigation to login page
    navigate('/login', { replace: true });
  };
  
  const drawerItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Issues', icon: <BugReportIcon />, path: '/issues' },
    { text: 'My Assignments', icon: <AssignmentIcon />, path: '/assignments' },
    { text: 'Saved Views', icon: <ViewListIcon />, path: '/views' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
    { divider: true },
    { text: 'Teams', icon: <GroupIcon />, path: '/teams' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 2,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main, 
            letterSpacing: -0.5 
          }}
        >
          Buganizer
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider />
      
      <List sx={{ py: 1 }}>
        {drawerItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          ) : (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path || ''}
                selected={location.pathname === item.path}
                sx={{
                  py: 1,
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? theme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: location.pathname === item.path ? 600 : 400 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'flex' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography 
              variant="h6" 
              noWrap 
              component={RouterLink} 
              to="/"
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                textDecoration: 'none', 
                letterSpacing: -0.5,
                flexGrow: 0,
                mr: 3,
              }}
            >
              Buganizer
            </Typography>
            
            <Box 
              sx={{ 
                borderRadius: 28,
                backgroundColor: alpha(theme.palette.common.black, 0.04),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.black, 0.06),
                },
                px: 2,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                width: { xs: '60%', md: '40%' },
              }}
            >
              <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
              <input
                placeholder="Search issues, components..."
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  background: 'transparent',
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                }}
              />
            </Box>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Button
              variant="contained"
              startIcon={<BugReportIcon />}
              sx={{
                mr: 2,
                display: { xs: 'none', sm: 'flex' },
                boxShadow: 2,
                px: 2,
              }}
              component={RouterLink}
              to="/issues/new"
            >
              New Issue
            </Button>
            
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={handleNotificationsOpen}
                sx={{ ml: 1 }}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                elevation: 3,
                sx: { width: 320, maxHeight: 500, mt: 1.5, borderRadius: 2 },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', p: 2, pb: 1 }}>
                Notifications
              </Typography>
              <Divider />
              <MenuItem onClick={handleNotificationsClose}>
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Critical Issue Reported
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Frontend crash on Safari - 20 minutes ago
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Issue Assigned to You
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    API response validation error - 1 hour ago
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    SLA at Risk
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Authentication bug due in 4 hours
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: 'center' }}>
                <Typography variant="body2" color="primary">
                  View All Notifications
                </Typography>
              </MenuItem>
            </Menu>
            
            <Tooltip title="Account">
              <IconButton 
                onClick={handleProfileOpen} 
                sx={{ p: 0, ml: 1.5 }}
                aria-label="account"
              >
                <Avatar 
                  alt={user?.name || 'User'} 
                  src={user?.avatarUrl}
                  sx={{ 
                    width: 36, 
                    height: 36,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={profileAnchorEl}
              open={Boolean(profileAnchorEl)}
              onClose={handleProfileClose}
              PaperProps={{
                elevation: 3,
                sx: { width: 220, mt: 1.5, borderRadius: 2 },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleProfileClose}>
                <ListItemIcon>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>My Issues</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleProfileClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogoutClick}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          },
        }}
      >
        <Toolbar />
        {drawer}
      </Drawer>
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` }, 
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ml: 0,
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3}}>
          <Outlet />
        </Container>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to log out? Any unsaved work may be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;