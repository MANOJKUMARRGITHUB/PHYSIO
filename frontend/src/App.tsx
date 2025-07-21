import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ExerciseSelector from './components/ExerciseSelector';
import ExerciseMonitor from './components/ExerciseMonitor';
import Dashboard from './components/Dashboard';
import MediaPipeDebug from './components/MediaPipeDebug';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

type AppView = 'exercises' | 'monitor' | 'dashboard' | 'debug';

const AppContent: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('exercises');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercise(exercise);
    setCurrentView('monitor');
  };

  const handleBackToExercises = () => {
    setCurrentView('exercises');
    setSelectedExercise('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: AppView) => {
    setCurrentView(newValue);
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <FitnessCenterIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PhysioTracker - AI Exercise Monitor
          </Typography>
          
          {/* Navigation Tabs */}
          <Tabs 
            value={currentView} 
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ mr: 2 }}
          >
            <Tab 
              icon={<PlayArrowIcon />} 
              label="Exercises" 
              value="exercises"
              sx={{ color: 'white' }}
            />
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              value="dashboard"
              sx={{ color: 'white' }}
            />
            <Tab 
              icon={<BugReportIcon />} 
              label="Debug" 
              value="debug"
              sx={{ color: 'white' }}
            />
          </Tabs>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {currentUser.displayName || currentUser.email}
            </Typography>
            <Button
              onClick={handleMenu}
              sx={{ p: 0 }}
            >
              <Avatar 
                src={currentUser.photoURL || undefined}
                sx={{ width: 32, height: 32 }}
              >
                {currentUser.displayName?.[0] || currentUser.email?.[0]}
              </Avatar>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main">
        {currentView === 'exercises' && (
          <ExerciseSelector onExerciseSelect={handleExerciseSelect} />
        )}
        
        {currentView === 'monitor' && selectedExercise && (
          <ExerciseMonitor 
            selectedExercise={selectedExercise} 
            onBack={handleBackToExercises}
          />
        )}
        
        {currentView === 'dashboard' && (
          <Dashboard />
        )}
        
        {currentView === 'debug' && (
          <MediaPipeDebug />
        )}
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
