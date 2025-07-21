import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PredictionResponse {
  exercise: string;
  confidence: number;
  phase: string;
  rep_count: number;
  joint_angles: number[];
  timestamp: string;
}

export interface SessionData {
  user_id: string;
  exercise: string;
  total_reps: number;
  duration: number;
  session_data?: any[];
}

export interface UserSession {
  user_id: string;
  exercise: string;
  total_reps: number;
  duration: number;
  timestamp: string;
  session_data: any[];
}

export interface SessionSummary {
  total_sessions: number;
  total_reps: number;
  total_duration: number;
  exercise_breakdown: {
    [exercise: string]: {
      sessions: number;
      total_reps: number;
      total_duration: number;
    };
  };
}

export interface UserSessionsResponse {
  user_id: string;
  sessions: UserSession[];
  summary: SessionSummary;
}

class ApiService {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Get available exercises
  async getExercises(): Promise<string[]> {
    try {
      const response = await api.get('/exercises');
      return response.data.exercises;
    } catch (error) {
      console.error('Failed to get exercises:', error);
      throw error;
    }
  }

  // Predict exercise from joint angles
  async predictExercise(jointAngles: number[], selectedExercise?: string): Promise<PredictionResponse> {
    try {
      const response = await api.post('/predict', {
        joint_angles: jointAngles,
        selected_exercise: selectedExercise
      });
      return response.data;
    } catch (error) {
      console.error('Prediction failed:', error);
      throw error;
    }
  }

  // Reset exercise session
  async resetSession() {
    try {
      const response = await api.post('/reset_session');
      return response.data;
    } catch (error) {
      console.error('Failed to reset session:', error);
      throw error;
    }
  }

  // Log exercise session
  async logSession(sessionData: SessionData) {
    try {
      const response = await api.post('/log_session', sessionData);
      return response.data;
    } catch (error) {
      console.error('Failed to log session:', error);
      throw error;
    }
  }

  // Get user sessions
  async getUserSessions(userId: string): Promise<UserSessionsResponse> {
    try {
      const response = await api.get(`/sessions/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw error;
    }
  }

  // Get all sessions (for admin)
  async getAllSessions() {
    try {
      const response = await api.get('/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to get all sessions:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService(); 