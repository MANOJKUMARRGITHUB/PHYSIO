import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

export interface JointAngles {
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  leftHip: number;
  rightHip: number;
  leftKnee: number;
  rightKnee: number;
  spine: number;
}

// Calculate angle between three points
function calculateAngle(point1: any, point2: any, point3: any): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };
  
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y
  };
  
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  
  return (angle * 180) / Math.PI;
}

// Extract joint angles from MediaPipe pose landmarks
export function extractJointAngles(landmarks: any): number[] {
  if (!landmarks || landmarks.length < 33) {
    return Array(9).fill(0);
  }
  
  try {
    // MediaPipe Pose landmark indices
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    
    const angles = [];
    
    // Left shoulder angle (shoulder-elbow-wrist)
    angles.push(calculateAngle(leftShoulder, leftElbow, leftWrist));
    
    // Right shoulder angle (shoulder-elbow-wrist)
    angles.push(calculateAngle(rightShoulder, rightElbow, rightWrist));
    
    // Left elbow angle (shoulder-elbow-wrist)
    angles.push(calculateAngle(leftShoulder, leftElbow, leftWrist));
    
    // Right elbow angle (shoulder-elbow-wrist)
    angles.push(calculateAngle(rightShoulder, rightElbow, rightWrist));
    
    // Left hip angle (shoulder-hip-knee)
    angles.push(calculateAngle(leftShoulder, leftHip, leftKnee));
    
    // Right hip angle (shoulder-hip-knee)
    angles.push(calculateAngle(rightShoulder, rightHip, rightKnee));
    
    // Left knee angle (hip-knee-ankle)
    angles.push(calculateAngle(leftHip, leftKnee, leftAnkle));
    
    // Right knee angle (hip-knee-ankle)
    angles.push(calculateAngle(rightHip, rightKnee, rightAnkle));
    
    // Spine angle (approximation)
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    const verticalRef = {
      x: shoulderMidpoint.x,
      y: shoulderMidpoint.y - 0.1
    };
    
    angles.push(calculateAngle(verticalRef, shoulderMidpoint, hipMidpoint));
    
    return angles;
  } catch (error) {
    console.error('Error calculating joint angles:', error);
    return Array(9).fill(0);
  }
}

// Initialize MediaPipe Pose
export function initializePoseDetection(
  onResults: (results: any) => void,
  videoRef: React.RefObject<HTMLVideoElement>
): { pose: Pose; camera: Camera | null } {
  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });
  
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  pose.onResults(onResults);
  
  let camera: Camera | null = null;
  
  if (videoRef.current) {
    camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });
  }
  
  return { pose, camera };
}

// Voice feedback messages
interface VoiceFeedback {
  goodRep: string[];
  improveForm: string[];
  encouragement: string[];
  exerciseSpecific: { [key: string]: string[] };
}

export const voiceFeedback: VoiceFeedback = {
  goodRep: [
    "Great job!",
    "Perfect form!",
    "Excellent rep!",
    "Keep it up!",
    "Nice work!",
    "Outstanding!",
    "Well done!",
    "Strong rep!"
  ],
  improveForm: [
    "Keep your back straight",
    "Control the movement",
    "Slower tempo",
    "Focus on form",
    "Full range of motion",
    "Engage your core",
    "Breathe properly",
    "Maintain posture"
  ],
  encouragement: [
    "You're doing great!",
    "Almost there!",
    "Keep going!",
    "Stay strong!",
    "Push through!",
    "You've got this!",
    "Don't give up!",
    "One more rep!"
  ],
  // Exercise-specific feedback
  exerciseSpecific: {
    'bench_press': [
      "Lower the bar to your chest",
      "Press up explosively",
      "Keep your feet planted",
      "Squeeze your shoulder blades"
    ],
    'squat': [
      "Go deeper",
      "Knees out",
      "Drive through your heels",
      "Keep your chest up"
    ],
    'deadlift': [
      "Straight back",
      "Drive with your hips",
      "Squeeze your glutes",
      "Keep the bar close"
    ],
    'push_up': [
      "Lower to your chest",
      "Keep your body straight",
      "Push up strong",
      "Don't let your hips sag"
    ],
    'pull_up': [
      "Pull your chest to the bar",
      "Control the descent",
      "Engage your lats",
      "Full range of motion"
    ],
    'shoulder_press': [
      "Press overhead",
      "Keep your core tight",
      "Don't arch your back",
      "Control the weight"
    ],
    'biceps_curl': [
      "Squeeze your biceps",
      "Control the negative",
      "Don't swing the weight",
      "Full extension"
    ],
    'tricep_dips': [
      "Lower until elbows are 90 degrees",
      "Press up strong",
      "Keep your body upright",
      "Don't flare your elbows"
    ],
    'plank': [
      "Hold strong",
      "Keep your core tight",
      "Breathe steadily",
      "Maintain the position"
    ],
    'russian_twist': [
      "Rotate fully",
      "Keep your core engaged",
      "Control the movement",
      "Touch the ground"
    ],
    'lat_pulldown': [
      "Pull to your upper chest",
      "Squeeze your lats",
      "Control the weight up",
      "Keep your torso upright"
    ],
    'leg_extension': [
      "Extend fully",
      "Squeeze your quads",
      "Control the descent",
      "Don't swing your legs"
    ],
    'leg_raises': [
      "Raise your legs up",
      "Keep them straight",
      "Control the descent",
      "Engage your lower abs"
    ],
    'hip_thrust': [
      "Drive your hips up",
      "Squeeze your glutes",
      "Keep your core tight",
      "Full hip extension"
    ],
    'romanian_deadlift': [
      "Push your hips back",
      "Feel the stretch in your hamstrings",
      "Drive your hips forward",
      "Keep the bar close"
    ],
    'lateral_raise': [
      "Raise to shoulder height",
      "Control the descent",
      "Don't use momentum",
      "Feel it in your delts"
    ],
    'hammer_curl': [
      "Keep your wrists straight",
      "Squeeze at the top",
      "Control the negative",
      "Don't swing"
    ],
    't_bar_row': [
      "Pull to your lower chest",
      "Squeeze your shoulder blades",
      "Keep your back straight",
      "Control the weight"
    ],
    'tricep_pushdown': [
      "Push down fully",
      "Keep your elbows at your sides",
      "Squeeze your triceps",
      "Control the weight up"
    ],
    'chest_fly_machine': [
      "Squeeze your pecs together",
      "Control the stretch",
      "Keep a slight bend in your elbows",
      "Feel the chest contraction"
    ],
    'incline_bench_press': [
      "Press up and slightly back",
      "Keep your shoulders down",
      "Focus on your upper chest",
      "Control the descent"
    ],
    'decline_bench_press': [
      "Press straight up",
      "Focus on your lower chest",
      "Keep your core engaged",
      "Full range of motion"
    ]
  }
};

// Text-to-speech function
export function speak(text: string) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
  }
}

// Get random voice feedback
export function getRandomFeedback(type: 'goodRep' | 'improveForm' | 'encouragement'): string {
  const messages = voiceFeedback[type] as string[];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get exercise-specific feedback
export function getExerciseSpecificFeedback(exercise: string): string {
  const exerciseKey = exercise.toLowerCase().replace(/[-_]/g, '_');
  
  // Try to match exercise-specific feedback
  if (voiceFeedback.exerciseSpecific[exerciseKey]) {
    const messages = voiceFeedback.exerciseSpecific[exerciseKey];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // Try partial matches for compound exercise names
  for (const [key, messages] of Object.entries(voiceFeedback.exerciseSpecific)) {
    if (exerciseKey.includes(key) || key.includes(exerciseKey)) {
      return messages[Math.floor(Math.random() * messages.length)];
    }
  }
  
  // Fall back to general form feedback
  return getRandomFeedback('improveForm');
}

// Get milestone feedback based on rep count
export function getMilestoneFeedback(repCount: number): string {
  if (repCount === 1) return "First rep complete!";
  if (repCount === 5) return "Halfway there!";
  if (repCount === 10) return "Great work, ten reps!";
  if (repCount === 15) return "Fifteen reps strong!";
  if (repCount === 20) return "Twenty reps! You're on fire!";
  if (repCount % 10 === 0) return `${repCount} reps completed!`;
  if (repCount % 5 === 0) return `${repCount} reps down!`;
  
  return getRandomFeedback('encouragement');
} 