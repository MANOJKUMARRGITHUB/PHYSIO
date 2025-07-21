import numpy as np
import math

def calculate_angle(point1, point2, point3):
    """
    Calculate angle between three points (in degrees)
    point2 is the vertex of the angle
    """
    # Calculate vectors
    vector1 = np.array([point1[0] - point2[0], point1[1] - point2[1]])
    vector2 = np.array([point3[0] - point2[0], point3[1] - point2[1]])
    
    # Calculate angle using dot product
    cosine_angle = np.dot(vector1, vector2) / (np.linalg.norm(vector1) * np.linalg.norm(vector2))
    
    # Handle numerical errors
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    
    angle = np.arccos(cosine_angle)
    return np.degrees(angle)

def extract_pose_angles(landmarks):
    """
    Extract key joint angles from MediaPipe pose landmarks
    Returns a list of angles that can be used for exercise classification
    
    MediaPipe Pose landmark indices:
    0: nose, 11: left_shoulder, 12: right_shoulder
    13: left_elbow, 14: right_elbow, 15: left_wrist, 16: right_wrist
    23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee
    27: left_ankle, 28: right_ankle
    """
    
    angles = []
    
    try:
        # Convert landmarks to list of [x, y] coordinates
        points = [[lm.x, lm.y] for lm in landmarks.landmark]
        
        # Left arm angles
        if len(points) > 16:
            # Left shoulder angle (shoulder-elbow-wrist)
            left_shoulder_angle = calculate_angle(points[11], points[13], points[15])
            angles.append(left_shoulder_angle)
            
            # Right shoulder angle (shoulder-elbow-wrist)
            right_shoulder_angle = calculate_angle(points[12], points[14], points[16])
            angles.append(right_shoulder_angle)
            
            # Left elbow angle (shoulder-elbow-wrist)
            left_elbow_angle = calculate_angle(points[11], points[13], points[15])
            angles.append(left_elbow_angle)
            
            # Right elbow angle (shoulder-elbow-wrist)
            right_elbow_angle = calculate_angle(points[12], points[14], points[16])
            angles.append(right_elbow_angle)
        
        # Torso angles
        if len(points) > 24:
            # Left hip angle (shoulder-hip-knee)
            left_hip_angle = calculate_angle(points[11], points[23], points[25])
            angles.append(left_hip_angle)
            
            # Right hip angle (shoulder-hip-knee)
            right_hip_angle = calculate_angle(points[12], points[24], points[26])
            angles.append(right_hip_angle)
        
        # Leg angles
        if len(points) > 28:
            # Left knee angle (hip-knee-ankle)
            left_knee_angle = calculate_angle(points[23], points[25], points[27])
            angles.append(left_knee_angle)
            
            # Right knee angle (hip-knee-ankle)
            right_knee_angle = calculate_angle(points[24], points[26], points[28])
            angles.append(right_knee_angle)
        
        # Spine angle (approximation using shoulders and hips)
        if len(points) > 24:
            # Calculate spine inclination
            shoulder_midpoint = [(points[11][0] + points[12][0])/2, (points[11][1] + points[12][1])/2]
            hip_midpoint = [(points[23][0] + points[24][0])/2, (points[23][1] + points[24][1])/2]
            
            # Vertical reference point
            vertical_ref = [shoulder_midpoint[0], shoulder_midpoint[1] - 0.1]
            
            spine_angle = calculate_angle(vertical_ref, shoulder_midpoint, hip_midpoint)
            angles.append(spine_angle)
        
        # Ensure we always return a consistent number of angles
        # Pad with zeros if we don't have enough angles
        while len(angles) < 9:  # 9 key angles
            angles.append(0.0)
            
    except Exception as e:
        print(f"Error calculating angles: {e}")
        # Return default angles if calculation fails
        angles = [0.0] * 9
    
    return angles

def normalize_angles(angles):
    """
    Normalize angles to 0-1 range for better model performance
    """
    normalized = []
    for angle in angles:
        # Normalize to 0-1 (angles are typically 0-180 degrees)
        normalized_angle = min(max(angle / 180.0, 0.0), 1.0)
        normalized.append(normalized_angle)
    
    return normalized

def get_exercise_specific_angles(landmarks, exercise_type):
    """
    Get angles specific to particular exercises
    """
    all_angles = extract_pose_angles(landmarks)
    
    if exercise_type.lower() in ['pushup', 'push-up', 'push_up']:
        # For push-ups, focus on arm and torso angles
        return all_angles[:5]  # shoulder, elbow, and hip angles
    
    elif exercise_type.lower() in ['squat', 'squats']:
        # For squats, focus on leg and hip angles
        return all_angles[4:]  # hip, knee, and spine angles
    
    elif exercise_type.lower() in ['jumping_jack', 'jumping-jack']:
        # For jumping jacks, use all angles
        return all_angles
    
    else:
        # Default: return all angles
        return all_angles 