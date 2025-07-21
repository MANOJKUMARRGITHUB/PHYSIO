import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SearchIcon from '@mui/icons-material/Search';
import { apiService } from '../services/api';

interface ExerciseSelectorProps {
  onExerciseSelect: (exercise: string) => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onExerciseSelect }) => {
  const [exercises, setExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Exercise information for all trained exercises
  const exerciseInfo: { [key: string]: { 
    name: string; 
    description: string; 
    benefits: string[]; 
    difficulty: string;
    category: string;
    muscleGroups: string[];
  } } = {
    'barbell_biceps_curl': {
      name: 'Barbell Biceps Curl',
      description: 'Standing bicep exercise using a barbell to build arm strength',
      benefits: ['Bicep strength', 'Arm definition', 'Grip strength'],
      difficulty: 'Beginner',
      category: 'Arms',
      muscleGroups: ['Biceps', 'Forearms']
    },
    'bench_press': {
      name: 'Bench Press',
      description: 'Classic chest exercise performed lying on a bench',
      benefits: ['Chest strength', 'Tricep development', 'Shoulder stability'],
      difficulty: 'Intermediate',
      category: 'Chest',
      muscleGroups: ['Chest', 'Triceps', 'Shoulders']
    },
    'chest_fly_machine': {
      name: 'Chest Fly Machine',
      description: 'Chest isolation exercise using a fly machine',
      benefits: ['Chest isolation', 'Pectoral definition', 'Shoulder mobility'],
      difficulty: 'Beginner',
      category: 'Chest',
      muscleGroups: ['Chest', 'Front Deltoids']
    },
    'deadlift': {
      name: 'Deadlift',
      description: 'Full body compound exercise lifting weight from the ground',
      benefits: ['Total body strength', 'Posterior chain', 'Core stability'],
      difficulty: 'Advanced',
      category: 'Full Body',
      muscleGroups: ['Hamstrings', 'Glutes', 'Back', 'Core']
    },
    'decline_bench_press': {
      name: 'Decline Bench Press',
      description: 'Chest exercise performed on a decline bench',
      benefits: ['Lower chest focus', 'Tricep strength', 'Core engagement'],
      difficulty: 'Intermediate',
      category: 'Chest',
      muscleGroups: ['Lower Chest', 'Triceps', 'Shoulders']
    },
    'hammer_curl': {
      name: 'Hammer Curl',
      description: 'Bicep exercise with neutral grip targeting brachialis',
      benefits: ['Bicep peak', 'Forearm strength', 'Grip improvement'],
      difficulty: 'Beginner',
      category: 'Arms',
      muscleGroups: ['Biceps', 'Brachialis', 'Forearms']
    },
    'hip_thrust': {
      name: 'Hip Thrust',
      description: 'Glute activation exercise performed with elevated shoulders',
      benefits: ['Glute strength', 'Hip mobility', 'Posterior chain'],
      difficulty: 'Intermediate',
      category: 'Glutes',
      muscleGroups: ['Glutes', 'Hamstrings', 'Core']
    },
    'incline_bench_press': {
      name: 'Incline Bench Press',
      description: 'Upper chest focused press on an inclined bench',
      benefits: ['Upper chest development', 'Shoulder strength', 'Core stability'],
      difficulty: 'Intermediate',
      category: 'Chest',
      muscleGroups: ['Upper Chest', 'Shoulders', 'Triceps']
    },
    'lat_pulldown': {
      name: 'Lat Pulldown',
      description: 'Back width building exercise using lat pulldown machine',
      benefits: ['Back width', 'Lat development', 'Bicep assistance'],
      difficulty: 'Beginner',
      category: 'Back',
      muscleGroups: ['Lats', 'Rhomboids', 'Biceps']
    },
    'lateral_raise': {
      name: 'Lateral Raise',
      description: 'Shoulder isolation exercise for medial deltoid development',
      benefits: ['Shoulder width', 'Deltoid definition', 'Shoulder stability'],
      difficulty: 'Beginner',
      category: 'Shoulders',
      muscleGroups: ['Side Deltoids', 'Traps']
    },
    'leg_extension': {
      name: 'Leg Extension',
      description: 'Quadriceps isolation exercise using leg extension machine',
      benefits: ['Quad isolation', 'Knee strength', 'Leg definition'],
      difficulty: 'Beginner',
      category: 'Legs',
      muscleGroups: ['Quadriceps']
    },
    'leg_raises': {
      name: 'Leg Raises',
      description: 'Core and hip flexor exercise lifting legs while lying down',
      benefits: ['Lower abs', 'Hip flexor strength', 'Core stability'],
      difficulty: 'Intermediate',
      category: 'Core',
      muscleGroups: ['Lower Abs', 'Hip Flexors']
    },
    'plank': {
      name: 'Plank',
      description: 'Isometric core exercise holding body in straight line',
      benefits: ['Core strength', 'Posture improvement', 'Stability'],
      difficulty: 'Beginner',
      category: 'Core',
      muscleGroups: ['Core', 'Shoulders', 'Glutes']
    },
    'pull_up': {
      name: 'Pull Up',
      description: 'Upper body compound exercise pulling body weight up',
      benefits: ['Back strength', 'Functional strength', 'Grip strength'],
      difficulty: 'Advanced',
      category: 'Back',
      muscleGroups: ['Lats', 'Biceps', 'Rhomboids']
    },
    'push-up': {
      name: 'Push Up',
      description: 'Bodyweight chest exercise in prone position',
      benefits: ['Chest strength', 'Core engagement', 'Functional movement'],
      difficulty: 'Beginner',
      category: 'Chest',
      muscleGroups: ['Chest', 'Triceps', 'Core']
    },
    'romanian_deadlift': {
      name: 'Romanian Deadlift',
      description: 'Hip hinge movement focusing on hamstrings and glutes',
      benefits: ['Hamstring flexibility', 'Glute strength', 'Hip mobility'],
      difficulty: 'Intermediate',
      category: 'Legs',
      muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back']
    },
    'russian_twist': {
      name: 'Russian Twist',
      description: 'Rotational core exercise targeting obliques',
      benefits: ['Oblique strength', 'Rotational power', 'Core stability'],
      difficulty: 'Intermediate',
      category: 'Core',
      muscleGroups: ['Obliques', 'Core', 'Hip Flexors']
    },
    'shoulder_press': {
      name: 'Shoulder Press',
      description: 'Overhead pressing movement for shoulder development',
      benefits: ['Shoulder strength', 'Overhead stability', 'Core engagement'],
      difficulty: 'Intermediate',
      category: 'Shoulders',
      muscleGroups: ['Shoulders', 'Triceps', 'Core']
    },
    'squat': {
      name: 'Squat',
      description: 'Fundamental lower body compound exercise',
      benefits: ['Leg strength', 'Hip mobility', 'Functional movement'],
      difficulty: 'Beginner',
      category: 'Legs',
      muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings']
    },
    't_bar_row': {
      name: 'T-Bar Row',
      description: 'Back thickness exercise using T-bar or barbell',
      benefits: ['Back thickness', 'Rhomboid development', 'Posture improvement'],
      difficulty: 'Intermediate',
      category: 'Back',
      muscleGroups: ['Mid Traps', 'Rhomboids', 'Lats']
    },
    'tricep_dips': {
      name: 'Tricep Dips',
      description: 'Bodyweight tricep exercise using parallel bars or bench',
      benefits: ['Tricep strength', 'Shoulder stability', 'Functional strength'],
      difficulty: 'Intermediate',
      category: 'Arms',
      muscleGroups: ['Triceps', 'Chest', 'Shoulders']
    },
    'tricep_pushdown': {
      name: 'Tricep Pushdown',
      description: 'Cable tricep isolation exercise',
      benefits: ['Tricep isolation', 'Arm definition', 'Elbow stability'],
      difficulty: 'Beginner',
      category: 'Arms',
      muscleGroups: ['Triceps']
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedExercises = await apiService.getExercises();
      setExercises(fetchedExercises);
    } catch (error) {
      setError('Failed to load exercises. Please make sure the backend server is running.');
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Chest': '#e3f2fd',
      'Back': '#f3e5f5',
      'Arms': '#fff3e0',
      'Shoulders': '#e8f5e8',
      'Legs': '#fff8e1',
      'Core': '#fce4ec',
      'Glutes': '#f1f8e9',
      'Full Body': '#e0f2f1'
    };
    return colors[category] || '#f5f5f5';
  };

  const formatExerciseName = (exercise: string): string => {
    const info = exerciseInfo[exercise];
    return info ? info.name : exercise.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredExercises = exercises.filter(exercise => {
    const info = exerciseInfo[exercise];
    const searchLower = searchTerm.toLowerCase();
    return (
      info?.name.toLowerCase().includes(searchLower) ||
      info?.category.toLowerCase().includes(searchLower) ||
      info?.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchLower)) ||
      exercise.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading exercises...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <FitnessCenterIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Choose Your Exercise
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Select an exercise to start your AI-powered physiotherapy session
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {exercises.length} exercises available from your trained model
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchExercises}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TextField
          variant="outlined"
          placeholder="Search exercises, muscle groups, or categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '100%', maxWidth: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredExercises.map((exercise) => {
          const info = exerciseInfo[exercise] || {
            name: formatExerciseName(exercise),
            description: 'Physiotherapy exercise for strength and mobility',
            benefits: ['Strength', 'Mobility', 'Health'],
            difficulty: 'Beginner',
            category: 'General',
            muscleGroups: ['Multiple']
          };

          return (
            <Grid item xs={12} sm={6} md={4} key={exercise}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, elevation 0.2s',
                  backgroundColor: getCategoryColor(info.category),
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    elevation: 8
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                      {info.name}
                    </Typography>
                    <Chip 
                      label={info.difficulty} 
                      color={getDifficultyColor(info.difficulty) as any}
                      size="small"
                    />
                  </Box>

                  <Chip 
                    label={info.category} 
                    variant="outlined" 
                    size="small" 
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {info.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Target Muscles:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {info.muscleGroups.map((muscle, index) => (
                      <Chip 
                        key={index}
                        label={muscle} 
                        variant="outlined" 
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Benefits:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {info.benefits.map((benefit, index) => (
                      <Chip 
                        key={index}
                        label={benefit} 
                        variant="filled" 
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => onExerciseSelect(exercise)}
                    size="large"
                    sx={{ 
                      fontWeight: 600,
                      py: 1.5 
                    }}
                  >
                    Start Exercise
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredExercises.length === 0 && exercises.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No exercises found matching "{searchTerm}"
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setSearchTerm('')}
            sx={{ mt: 2 }}
          >
            Clear Search
          </Button>
        </Box>
      )}

      {exercises.length === 0 && !loading && !error && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No exercises available. Please check your backend connection.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ExerciseSelector; 