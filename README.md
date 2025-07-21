# PhysioTracker - AI-Powered Physiotherapy Exercise Monitoring

A full-stack web application that uses AI to monitor physiotherapy exercises in real-time, providing automated rep counting, form feedback, and progress tracking.

## 🎯 Features

### 🤖 AI-Powered Exercise Recognition
- Real-time exercise classification using BiLSTM neural networks
- Automated repetition counting with phase detection (up/down movements)
- Support for multiple exercise types (push-ups, squats, jumping jacks, etc.)

### 📹 Computer Vision Integration
- MediaPipe Pose detection for joint angle calculation
- Real-time webcam feed with pose landmark overlay
- Accurate body posture analysis and movement tracking

### 🔊 Interactive Feedback
- Voice feedback using Web Speech API
- Real-time on-screen guidance and form corrections
- Encouraging messages and coaching tips

### 📊 Progress Tracking & Analytics
- Personal dashboard with exercise history
- Progress charts and statistics using Recharts
- Session logging with duration and performance metrics
- Exercise breakdown and trend analysis

### 🔐 User Authentication
- Firebase Google Authentication
- Secure user sessions and data management
- Personalized exercise tracking per user

### 💻 Modern UI/UX
- Material-UI components for clean, professional interface
- Responsive design for desktop and mobile
- Intuitive navigation and user-friendly controls

## 🛠 Technology Stack

### Backend (Python Flask)
- **Flask** - Web framework
- **TensorFlow/Keras** - BiLSTM model inference
- **NumPy** - Numerical computations
- **scikit-learn** - Label encoding
- **Flask-CORS** - Cross-origin resource sharing

### Frontend (React TypeScript)
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Firebase Auth** - Authentication
- **MediaPipe** - Pose detection
- **Recharts** - Data visualization
- **Axios** - API communication

## 📁 Project Structure

```
Physiotherapy-project/
├── backend/
│   ├── venv/                    # Virtual environment
│   ├── app.py                   # Flask application
│   ├── run.py                   # Server startup script
│   ├── pose_utils.py           # Joint angle calculations
│   ├── requirements.txt        # Python dependencies
│   ├── bilstm_exercise_classifier.h5  # Trained model
│   ├── label_encoder.pkl       # Exercise labels
│   └── create_test_encoder.py  # Test data generator
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx       # Authentication component
│   │   │   ├── ExerciseSelector.tsx  # Exercise selection
│   │   │   ├── ExerciseMonitor.tsx   # Main monitoring interface
│   │   │   └── Dashboard.tsx   # Progress dashboard
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Firebase auth context
│   │   ├── services/
│   │   │   └── api.ts         # Backend API service
│   │   ├── utils/
│   │   │   └── poseDetection.ts # MediaPipe utilities
│   │   ├── firebase.ts        # Firebase configuration
│   │   └── App.tsx           # Main application
│   ├── package.json
│   └── public/
├── start-backend.bat          # Windows backend starter
├── start-frontend.bat         # Windows frontend starter
├── start-backend.sh           # Unix backend starter
├── start-frontend.sh          # Unix frontend starter
├── setup-check.py             # Setup verification
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Webcam for pose detection

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Physiotherapy-project/backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate on Windows
   venv\Scripts\activate
   
   # Activate on Unix/Mac
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Generate test label encoder (if needed):**
   ```bash
   python create_test_encoder.py
   ```

5. **Start Flask server:**
   ```bash
   python run.py
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Physiotherapy-project/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Firebase (Required for authentication):**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication with Google provider
   - Copy your Firebase config and update `src/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

4. **Start React development server:**
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 🎮 Quick Start (Windows)

Use the provided batch files for easy startup:

```bash
# Start backend
start-backend.bat

# Start frontend (in another terminal)
start-frontend.bat
```

## 📖 Usage Guide

### 1. Authentication
- Open the application in your browser (`http://localhost:3000`)
- Click "Sign in with Google" to authenticate
- Grant necessary permissions for webcam access

### 2. Exercise Selection
- Choose from available exercises detected by the AI model
- Each exercise shows difficulty level and benefits
- Click "Start Exercise" to begin monitoring

### 3. Exercise Monitoring
- Position yourself in front of the webcam
- Ensure your full body is visible for accurate pose detection
- The system will automatically:
  - Detect your exercise type
  - Count repetitions
  - Show current phase (up/down)
  - Provide voice feedback (if enabled)

### 4. Session Management
- Use Start/Pause/Stop controls during exercise
- Sessions are automatically logged with:
  - Exercise type
  - Total repetitions
  - Session duration
  - Timestamp

### 5. Progress Dashboard
- View comprehensive statistics and charts
- Track progress over time
- Analyze exercise breakdown and trends
- Filter data by time periods (week/month/all)

## 🔧 API Endpoints

### Backend REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/exercises` | GET | Get available exercises |
| `/predict` | POST | Predict exercise from joint angles |
| `/reset_session` | POST | Reset current session |
| `/log_session` | POST | Log completed session |
| `/sessions/<user_id>` | GET | Get user's session history |

### Example API Usage

```javascript
// Predict exercise
const response = await fetch('http://localhost:5000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    joint_angles: [45.2, 67.8, 123.4, ...]
  })
});

const prediction = await response.json();
// Returns: { exercise, confidence, phase, rep_count, ... }
```

## 🛠 Troubleshooting

### Common Issues

1. **Backend not starting:**
   - Ensure virtual environment is activated: `venv\Scripts\activate`
   - Install dependencies: `pip install -r requirements.txt`
   - Check that model files exist in the backend directory
   - Run `python create_test_encoder.py` to create test data

2. **Frontend build errors:**
   - Use `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`
   - Clear node_modules and reinstall if needed
   - Check Node.js version (16+ recommended)

3. **Webcam not working:**
   - Grant camera permissions in browser
   - Ensure no other applications are using the webcam
   - Try different browsers (Chrome recommended)

4. **MediaPipe loading issues:**
   - Check internet connection (CDN resources required)
   - Clear browser cache
   - Ensure proper HTTPS context for production

5. **Firebase authentication errors:**
   - Verify Firebase configuration in `firebase.ts`
   - Ensure Google provider is enabled in Firebase console
   - Check domain authorization in Firebase settings

### Setup Verification

Run the setup verification script to check your installation:

```bash
python setup-check.py
```

## 🎨 Customization

### Adding New Exercises
1. Update the exercise list in `create_test_encoder.py`
2. Run the script to regenerate the label encoder
3. Add exercise descriptions in `ExerciseSelector.tsx`
4. Update phase detection logic in `app.py` if needed

### Modifying Voice Feedback
Edit the feedback messages in `frontend/src/utils/poseDetection.ts`:
```typescript
export const voiceFeedback = {
  goodRep: ["Great job!", "Perfect form!", ...],
  improveForm: ["Keep your back straight", ...],
  encouragement: ["You're doing great!", ...]
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- MediaPipe team for pose detection technology
- TensorFlow team for machine learning framework
- Material-UI team for React components
- Firebase team for authentication services

## 📞 Support

For issues and questions:
1. Check this README and troubleshooting section
2. Run `python setup-check.py` to verify installation
3. Review error logs in browser console and backend terminal
4. Ensure all dependencies are properly installed
5. Verify Firebase configuration is correct

---

**Built with ❤️ for physiotherapy and rehabilitation** 