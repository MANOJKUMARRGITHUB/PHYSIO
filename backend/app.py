import os
import pickle
import numpy as np
from datetime import datetime
import json
import threading
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from dotenv import load_dotenv

# Import chat functionality
try:
    from unified_chat import chat_step, run_fitness_flow
    from fitness import generate_exercise_plan, append_prompt_to_json, explain_prompt_to_user, save_explanation_to_json
    CHAT_AVAILABLE = True
except ImportError as e:
    print(f"Chat functionality not available: {e}")
    CHAT_AVAILABLE = False

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS with explicit settings for frontend communication
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow frontend origins
     allow_headers=["Content-Type", "Authorization"],             # Allow these headers
     methods=["GET", "POST", "OPTIONS"],                         # Allow these methods
     supports_credentials=True                                   # Allow credentials
)

# Global variables for model and encoder
model = None
label_encoder = None
exercise_sessions = []  # In-memory storage for demo (use database in production)

# Exercise phase tracking
current_exercise_state = {
    'current_phase': 'down',  # 'up' or 'down'
    'rep_count': 0,
    'last_prediction': None,
    'phase_threshold': 0.7  # Confidence threshold for phase detection
}

def load_models():
    """Load the BiLSTM model and label encoder"""
    global model, label_encoder
    
    try:
        # Load the trained model
        model = load_model('model/model.h5')
        print("BiLSTM model loaded successfully")
        
        # Load the label encoder
        with open('model/label_encoder.pkl', 'rb') as f:
            label_encoder = pickle.load(f)
        print("Label encoder loaded successfully")
        print(f"Available exercises: {list(label_encoder.classes_)}")
        
    except Exception as e:
        print(f"Error loading models: {str(e)}")
        return False
    return True

def detect_exercise_phase(joint_angles, predicted_exercise, selected_exercise=None):
    """
    Detect if the exercise is in 'up' or 'down' phase based on joint angles
    Updated for the actual trained exercises
    Only counts reps if exercise matches selection
    """
    global current_exercise_state
    
    # Get key joint angles with safety checks
    shoulder_angle = joint_angles[0] if len(joint_angles) > 0 else 90
    elbow_angle = joint_angles[2] if len(joint_angles) > 2 else 90
    hip_angle = joint_angles[4] if len(joint_angles) > 4 else 90
    knee_angle = joint_angles[6] if len(joint_angles) > 6 else 90
    
    # Debug logging
    print(f"🔍 DEBUG Phase Detection:")
    print(f"   Exercise: {predicted_exercise}")
    print(f"   Angles - Shoulder: {shoulder_angle:.1f}°, Elbow: {elbow_angle:.1f}°, Hip: {hip_angle:.1f}°, Knee: {knee_angle:.1f}°")
    
    # Phase detection logic for each exercise type
    exercise_lower = predicted_exercise.lower().replace('-', '_')
    
    # Upper body pressing exercises - ADJUSTED THRESHOLDS
    if exercise_lower in ['bench_press', 'incline_bench_press', 'decline_bench_press', 'push_up']:
        # Down = arms bent (lower angle), Up = arms extended (higher angle)
        threshold = 120  # CHANGED: More realistic threshold for pressing exercises
        if elbow_angle < threshold:  
            new_phase = 'down'
        else:  # Arms extended - up position
            new_phase = 'up'
        print(f"   🔧 Pressing exercise logic: elbow_angle {elbow_angle:.1f}° < {threshold}° = {elbow_angle < threshold} → {new_phase}")
    
    # Bicep/Arm curl exercises - ADJUSTED
    elif exercise_lower in ['barbell_biceps_curl', 'hammer_curl']:
        # Down = arms extended (lower elbow angle), Up = arms curled (higher elbow angle)
        if elbow_angle < 120:  # CHANGED: from 90 to 120
            new_phase = 'down'
        else:  # Arms curled - up position
            new_phase = 'up'
    
    # Tricep exercises - ADJUSTED
    elif exercise_lower in ['tricep_dips', 'tricep_pushdown']:
        # Down = arms bent, Up = arms extended
        if elbow_angle < 100:  # CHANGED: from 60 to 100
            new_phase = 'down'
        else:  # Arms extended - up position
            new_phase = 'up'
    
    # Shoulder exercises - ADJUSTED
    elif exercise_lower in ['shoulder_press', 'lateral_raise']:
        # Down = arms lowered, Up = arms raised
        if shoulder_angle < 100:  # CHANGED: from 70 to 100
            new_phase = 'down'
        else:  # Arms raised - up position
            new_phase = 'up'
    
    # Leg exercises - squats - ADJUSTED
    elif exercise_lower in ['squat']:
        # Down = knees bent (lower knee angle), Up = legs extended (higher knee angle)
        if knee_angle < 120:  # CHANGED: from 90 to 120
            new_phase = 'down'
        else:  # Legs extended - up position
            new_phase = 'up'
    
    # Deadlift variations
    elif exercise_lower in ['deadlift', 'romanian_deadlift']:
        # Down = bent forward (lower hip angle), Up = standing (higher hip angle)
        if hip_angle < 140:  # CHANGED: from 120 to 140
            new_phase = 'down'
        else:  # Standing - up position
            new_phase = 'up'
    
    # Leg extension - ADJUSTED
    elif exercise_lower in ['leg_extension']:
        # Down = knees bent, Up = legs extended
        if knee_angle < 120:  # CHANGED: from 90 to 120
            new_phase = 'down'
        else:  # Legs extended - up position
            new_phase = 'up'
    
    # Hip thrust - ADJUSTED
    elif exercise_lower in ['hip_thrust']:
        # Down = hips lowered, Up = hips raised
        if hip_angle < 110:  # CHANGED: from 90 to 110
            new_phase = 'down'
        else:  # Hips raised - up position
            new_phase = 'up'
    
    # Pulling exercises (pull-ups, lat pulldown, t-bar row) - ADJUSTED
    elif exercise_lower in ['pull_up', 'lat_pulldown', 't_bar_row']:
        # Down = arms extended, Up = arms pulled
        if elbow_angle > 140:  # CHANGED: from 120 to 140
            new_phase = 'down'
        else:  # Arms pulled - up position
            new_phase = 'up'
    
    # Core exercises (leg raises, russian twist)
    elif exercise_lower in ['leg_raises']:
        # Down = legs lowered, Up = legs raised
        if hip_angle < 110:  # CHANGED: from 90 to 110
            new_phase = 'down'
        else:  # Legs raised - up position
            new_phase = 'up'
    
    elif exercise_lower in ['russian_twist']:
        # Use shoulder angle to detect rotation
        if shoulder_angle < 85:  # CHANGED: from 70 to 85
            new_phase = 'down'
        else:  # Center or other side - up
            new_phase = 'up'
    
    # Isometric exercises (plank)
    elif exercise_lower in ['plank']:
        # For plank, we maintain the phase and count based on time held
        new_phase = 'hold'
    
    # Machine exercises - ADJUSTED
    elif exercise_lower in ['chest_fly_machine']:
        # Down = arms wide, Up = arms together
        if shoulder_angle > 110:  # CHANGED: from 90 to 110
            new_phase = 'down'
        else:  # Arms together - up position
            new_phase = 'up'
    
    else:
        # Default phase detection for unknown exercises - ADJUSTED
        if shoulder_angle < 100:  # CHANGED: from 90 to 100
            new_phase = 'down'
        else:
            new_phase = 'up'
    
    # Debug current state
    old_phase = current_exercise_state['current_phase']
    old_rep_count = current_exercise_state['rep_count']
    
    # Count reps on phase transitions (except for isometric exercises)
    if new_phase != 'hold' and current_exercise_state['current_phase'] != new_phase:
        if current_exercise_state['current_phase'] == 'down' and new_phase == 'up':
            current_exercise_state['rep_count'] += 1
            print(f"   🔥 REP COMPLETED! {old_rep_count} → {current_exercise_state['rep_count']}")
        current_exercise_state['current_phase'] = new_phase
        print(f"   📈 Phase transition: {old_phase} → {new_phase}")
    elif new_phase == 'hold':
        # For isometric exercises, count time-based reps or maintain state
        current_exercise_state['current_phase'] = new_phase
    else:
        print(f"   ➡️  Phase maintained: {new_phase}")
    
    print(f"   🎯 Final: Phase={new_phase}, Reps={current_exercise_state['rep_count']}")
    
    return new_phase

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'encoder_loaded': label_encoder is not None
    })

@app.route('/exercises', methods=['GET'])
def get_exercises():
    """Get list of available exercises from label encoder"""
    if label_encoder is None:
        return jsonify({'error': 'Label encoder not loaded'}), 500
    
    return jsonify({
        'exercises': list(label_encoder.classes_)
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict exercise from joint angles"""
    try:
        data = request.get_json()
        joint_angles = data.get('joint_angles', [])
        selected_exercise = data.get('selected_exercise', None)  # NEW: Get selected exercise
        
        if not joint_angles or len(joint_angles) < 9:
            return jsonify({'error': 'Invalid joint angles data'}), 400
            
        # NEW: Validate pose quality - check if too many angles are zero (poor detection)
        zero_count = sum(1 for angle in joint_angles[:9] if abs(angle) < 5.0)  # Count near-zero angles
        if zero_count > 6:  # If more than 6 out of 9 key angles are near zero, pose quality is poor
            return jsonify({
                'exercise': 'unknown',
                'confidence': 0.0,
                'phase': 'unknown',
                'rep_count': current_exercise_state['rep_count'],
                'joint_angles': joint_angles,
                'timestamp': datetime.now().isoformat(),
                'error': 'Poor pose detection - please ensure you are fully visible in the camera'
            })
        
        # Ensure we have exactly 9 joint angles
        if len(joint_angles) > 9:
            joint_angles = joint_angles[:9]
        elif len(joint_angles) < 9:
            # Pad with zeros if needed
            joint_angles.extend([0] * (9 - len(joint_angles)))
        
        # Convert to numpy array
        angles_array = np.array(joint_angles, dtype=np.float32)
        
        # The model expects shape (batch_size, 30, 99)
        # We need to transform our 9 joint angles to this format
        
        # Option 1: Repeat the joint angles to create time series
        # Create 30 timesteps by slightly varying the joint angles
        timesteps = 30
        features_per_timestep = 99
        
        # Create base feature vector by expanding the 9 joint angles
        base_features = np.zeros(features_per_timestep)
        
        # Map our 9 joint angles to the first 9 positions
        base_features[:9] = angles_array
        
        # Fill additional features with derived/computed values
        # Add normalized angles (angles/180.0)
        base_features[9:18] = angles_array / 180.0
        
        # Add sin and cos transformations (useful for cyclic nature)
        base_features[18:27] = np.sin(np.radians(angles_array))
        base_features[27:36] = np.cos(np.radians(angles_array))
        
        # Add squared values
        base_features[36:45] = angles_array ** 2
        
        # Add angle differences (joint relationships)
        for i in range(8):
            base_features[45 + i] = abs(angles_array[i] - angles_array[i+1])
        
        # Fill remaining features with combinations and derived values
        for i in range(53, features_per_timestep):
            base_features[i] = np.mean(angles_array) * np.random.normal(1.0, 0.1)
        
        # Create time series by adding small variations
        time_series = np.zeros((timesteps, features_per_timestep))
        for t in range(timesteps):
            # Add small time-based variations to simulate movement
            variation = np.random.normal(0, 0.05, features_per_timestep)
            time_series[t] = base_features + variation
        
        # Reshape for model input: (1, 30, 99)
        model_input = time_series.reshape(1, timesteps, features_per_timestep)
        
        # Make prediction
        prediction = model.predict(model_input, verbose=0)
        
        # Get predicted class and confidence
        predicted_class_idx = np.argmax(prediction[0])
        confidence = float(np.max(prediction[0]))
        
        # Convert to exercise name
        predicted_exercise = label_encoder.inverse_transform([predicted_class_idx])[0]
        
        # NEW: Only detect phase and count reps if conditions are met
        phase = 'unknown'
        exercise_match = False
        
        # Check if detected exercise matches selected exercise and confidence is sufficient
        if selected_exercise:
            exercise_match = (predicted_exercise.lower() == selected_exercise.lower() and confidence >= 0.6)
        else:
            exercise_match = confidence >= 0.7  # Higher threshold if no exercise selected
            
        if exercise_match:
            # Only detect phase and count reps if exercise matches
            phase = detect_exercise_phase(joint_angles, predicted_exercise, selected_exercise)
        else:
            # Reset phase tracking if exercise doesn't match
            print(f"🚫 Exercise mismatch or low confidence: detected={predicted_exercise}, selected={selected_exercise}, confidence={confidence:.2f}")
        
        response = {
            'exercise': predicted_exercise,
            'confidence': confidence,
            'phase': phase,
            'rep_count': current_exercise_state['rep_count'],
            'joint_angles': joint_angles,
            'timestamp': datetime.now().isoformat(),
            'exercise_match': exercise_match,
            'selected_exercise': selected_exercise
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/reset_session', methods=['POST'])
def reset_session():
    """Reset the current exercise session"""
    global current_exercise_state
    
    current_exercise_state = {
        'current_phase': 'down',
        'rep_count': 0,
        'last_prediction': None,
        'phase_threshold': 0.7
    }
    
    return jsonify({'message': 'Session reset successfully'})

@app.route('/log_session', methods=['POST'])
def log_session():
    """
    Log exercise session data
    Expected input: {
        'user_id': 'user123',
        'exercise': 'pushup',
        'total_reps': 10,
        'duration': 120,  # seconds
        'session_data': [...] # optional detailed data
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'exercise', 'total_reps', 'duration']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        session_entry = {
            'user_id': data['user_id'],
            'exercise': data['exercise'],
            'total_reps': data['total_reps'],
            'duration': data['duration'],  # in seconds
            'timestamp': datetime.now().isoformat(),
            'session_data': data.get('session_data', [])
        }
        
        # Store session (in production, save to database)
        exercise_sessions.append(session_entry)
        
        return jsonify({
            'message': 'Session logged successfully',
            'session_id': len(exercise_sessions) - 1
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to log session: {str(e)}'}), 500

@app.route('/sessions/<user_id>', methods=['GET'])
def get_user_sessions(user_id):
    """Get all sessions for a specific user"""
    user_sessions = [session for session in exercise_sessions if session['user_id'] == user_id]
    
    # Calculate summary statistics
    total_sessions = len(user_sessions)
    total_reps = sum(session['total_reps'] for session in user_sessions)
    total_duration = sum(session['duration'] for session in user_sessions)
    
    # Group by exercise
    exercise_stats = {}
    for session in user_sessions:
        exercise = session['exercise']
        if exercise not in exercise_stats:
            exercise_stats[exercise] = {'sessions': 0, 'total_reps': 0, 'total_duration': 0}
        exercise_stats[exercise]['sessions'] += 1
        exercise_stats[exercise]['total_reps'] += session['total_reps']
        exercise_stats[exercise]['total_duration'] += session['duration']
    
    return jsonify({
        'user_id': user_id,
        'sessions': user_sessions,
        'summary': {
            'total_sessions': total_sessions,
            'total_reps': total_reps,
            'total_duration': total_duration,
            'exercise_breakdown': exercise_stats
        }
    })

@app.route('/sessions', methods=['GET'])
def get_all_sessions():
    """Get all sessions (for admin/debugging)"""
    return jsonify({'sessions': exercise_sessions})

# ========================================
# CHAT ENDPOINTS
# ========================================

@app.route("/start_chat", methods=["POST"])
def start_chat():
    """Handle chat interactions with the AI fitness assistant"""
    if not CHAT_AVAILABLE:
        return jsonify({"error": "Chat functionality not available"}), 500
    
    try:
        data = request.json
        flow = data.get("flow")
        message = data.get("message")
        history = data.get("history", [])
        user_data = data.get("user_data", {})

        if flow != "fitness":
            return jsonify({"error": "Only fitness flow supported"}), 400

        result = chat_step(flow, message, history, user_data)

        # Add this key to tell frontend if data collection is complete
        result["completed"] = all(result["user_data"].values()) if result.get("user_data") else False

        return jsonify(result)
    
    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({
            "error": "Chat service error",
            "reply": "Sorry, I'm having trouble processing your request. Please try again.",
            "user_data": user_data,
            "completed": False
        }), 500

@app.route("/custom_exercises", methods=["GET"])
def list_custom_exercises():
    """List custom exercises from the database"""
    try:
        base_path = "exercises_db/fitness"
        exercises = []

        if not os.path.exists(base_path):
            return jsonify(exercises)

        for folder in os.listdir(base_path):
            folder_path = os.path.join(base_path, folder)
            plan_path = os.path.join(folder_path, "plan.json")

            if os.path.isfile(plan_path):
                with open(plan_path, "r") as f:
                    try:
                        plan_data = json.load(f)

                        # Ensure proper structure
                        if 'user_data' in plan_data:
                            exercises.append(plan_data)
                    except json.JSONDecodeError:
                        continue

        return jsonify(exercises)
    
    except Exception as e:
        print(f"Error listing custom exercises: {str(e)}")
        return jsonify([])

@app.route("/generate_plan", methods=["POST"])
def generate_plan():
    """Generate a fitness plan based on user data"""
    if not CHAT_AVAILABLE:
        return jsonify({"error": "Plan generation not available"}), 500
    
    try:
        data = request.json
        flow = data.get("flow")
        user_data = data.get("user_data", {})

        if flow != "fitness":
            return jsonify({"error": "Only fitness flow supported"}), 400

        result = run_fitness_flow(user_data)
        return jsonify(result)
    
    except Exception as e:
        print(f"Plan generation error: {str(e)}")
        return jsonify({"error": "Failed to generate plan"}), 500

# Background monitoring functions
def run_monitor_agent(exercise_name):
    """Run monitoring agent in background"""
    subprocess.run(["python", "moniter_agent/main.py", exercise_name])

@app.route("/start_monitoring", methods=["POST"])
def start_monitoring():
    """Start background monitoring for an exercise"""
    try:
        data = request.json
        exercise_name = data.get("exercise_name")
        
        if not exercise_name:
            return jsonify({"error": "Exercise name required"}), 400
        
        # Start monitoring in background thread
        thread = threading.Thread(target=run_monitor_agent, args=(exercise_name,))
        thread.daemon = True
        thread.start()
        
        return jsonify({"message": f"Started monitoring for {exercise_name}"})
    
    except Exception as e:
        print(f"Monitoring error: {str(e)}")
        return jsonify({"error": "Failed to start monitoring"}), 500

if __name__ == '__main__':
    print("Starting Physiotherapy Exercise Monitoring Backend...")
    
    # Load models on startup
    if load_models():
        print("Models loaded successfully. Starting Flask server...")
        
        # ✅ Print all available routes
        print(f"✅ Available routes: {[str(rule) for rule in app.url_map.iter_rules()]}")
        
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load models. Please check model files.")
