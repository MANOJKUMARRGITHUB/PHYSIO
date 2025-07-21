import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import Webcam from 'react-webcam';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { extractJointAngles } from '../utils/poseDetection';

const MediaPipeDebug: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [poseDetected, setPoseDetected] = useState(false);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [jointAngles, setJointAngles] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showConnections, setShowConnections] = useState(true);

  // Initialize MediaPipe Pose
  useEffect(() => {
    const initializePose = async () => {
      try {
        console.log('🔄 Initializing MediaPipe Pose...');
        setError('');
        
        const pose = new Pose({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            console.log(`📦 Loading MediaPipe file: ${url}`);
            return url;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.3,  // Lower threshold for testing
          minTrackingConfidence: 0.3
        });

        pose.onResults(onPoseResults);
        poseRef.current = pose;
        
        console.log('✅ MediaPipe Pose initialized successfully');
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Error initializing pose detection:', error);
        setError(`Failed to initialize pose detection: ${error}`);
        setIsLoading(false);
      }
    };

    initializePose();

    return () => {
      if (cameraRef.current) {
        console.log('🛑 Stopping camera');
        cameraRef.current.stop();
      }
    };
  }, []);

  const onPoseResults = useCallback((results: any) => {
    console.log('📊 Pose results received:', results);
    
    if (!canvasRef.current) {
      console.warn('⚠️ Canvas ref not available');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Canvas context not available');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video frame
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      console.log(`✅ Pose detected! ${results.poseLandmarks.length} landmarks`);
      
      setPoseDetected(true);
      setLandmarkCount(results.poseLandmarks.length);
      
      // Calculate overall confidence (visibility average)
      const avgConfidence = results.poseLandmarks.reduce((sum: number, landmark: any) => 
        sum + (landmark.visibility || 0), 0) / results.poseLandmarks.length;
      setConfidence(avgConfidence);

      // Draw pose landmarks if enabled
      if (showConnections) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
      }
      
      if (showLandmarks) {
        drawLandmarks(ctx, results.poseLandmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        });
      }

      // Extract joint angles
      try {
        const angles = extractJointAngles(results.poseLandmarks);
        setJointAngles(angles);
        console.log('📐 Joint angles extracted:', angles);
      } catch (error) {
        console.error('❌ Error extracting joint angles:', error);
      }

      // Store debug info
      setDebugInfo({
        landmarkCount: results.poseLandmarks.length,
        avgConfidence: avgConfidence,
        firstLandmark: results.poseLandmarks[0],
        lastLandmark: results.poseLandmarks[results.poseLandmarks.length - 1],
        imageSize: results.image ? { width: results.image.width, height: results.image.height } : null
      });

    } else {
      console.log('❌ No pose landmarks detected');
      setPoseDetected(false);
      setLandmarkCount(0);
      setConfidence(0);
      setJointAngles([]);
      setDebugInfo(null);
    }
  }, [showLandmarks, showConnections]);

  const startCamera = useCallback(async () => {
    try {
      console.log('📹 Starting camera...');
      setError('');
      
      if (!poseRef.current) {
        throw new Error('Pose not initialized');
      }

      if (!webcamRef.current?.video) {
        throw new Error('Webcam video element not available');
      }

      // Request camera permissions explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      console.log('✅ Camera permissions granted');

      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video && poseRef.current) {
            try {
              await poseRef.current.send({ image: webcamRef.current.video });
            } catch (error) {
              console.error('❌ Error sending frame to pose detection:', error);
            }
          }
        },
        width: 640,
        height: 480
      });
      
      cameraRef.current = camera;
      await camera.start();
      
      console.log('✅ Camera started successfully');
      setIsActive(true);
      
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      setError(`Failed to start camera: ${error}`);
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    setIsActive(false);
    setPoseDetected(false);
    console.log('✅ Camera stopped');
  }, []);

  const resetTest = useCallback(() => {
    console.log('🔄 Resetting test...');
    stopCamera();
    setError('');
    setPoseDetected(false);
    setLandmarkCount(0);
    setConfidence(0);
    setJointAngles([]);
    setDebugInfo(null);
  }, [stopCamera]);

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        MediaPipe Debug Console
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This tool helps diagnose MediaPipe pose detection issues and verify keypoint tracking.
      </Typography>

      {/* Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Status</Typography>
              <Chip 
                label={isLoading ? 'Loading' : isActive ? 'Active' : 'Inactive'} 
                color={isLoading ? 'default' : isActive ? 'success' : 'default'}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Pose Detection</Typography>
              <Chip 
                label={poseDetected ? 'Detected' : 'Not Detected'} 
                color={poseDetected ? 'success' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Landmarks</Typography>
              <Typography variant="h4">{landmarkCount}</Typography>
              <Typography variant="caption">Expected: 33</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Confidence</Typography>
              <Typography variant="h4">{(confidence * 100).toFixed(1)}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={confidence * 100} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={startCamera}
            disabled={isLoading || isActive}
          >
            Start Camera
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            onClick={stopCamera}
            disabled={!isActive}
          >
            Stop Camera
          </Button>
          
          <Button
            variant="outlined"
            onClick={resetTest}
          >
            Reset
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
              />
            }
            label="Show Landmarks"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showConnections}
                onChange={(e) => setShowConnections(e.target.checked)}
              />
            }
            label="Show Connections"
          />
        </Box>
      </Paper>

      {/* Video and Canvas */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Webcam Feed
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                width={640}
                height={480}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: 'user'
                }}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              MediaPipe Output
            </Typography>
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#000'
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Debug Information */}
      {debugInfo && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Landmark Details</Typography>
              <Typography variant="body2">Count: {debugInfo.landmarkCount}</Typography>
              <Typography variant="body2">Avg Confidence: {(debugInfo.avgConfidence * 100).toFixed(1)}%</Typography>
              {debugInfo.imageSize && (
                <Typography variant="body2">
                  Image Size: {debugInfo.imageSize.width} x {debugInfo.imageSize.height}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Joint Angles</Typography>
              <Typography variant="body2" component="div">
                {jointAngles.length > 0 ? (
                  <Box>
                    {[
                      'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
                      'Left Hip', 'Right Hip', 'Left Knee', 'Right Knee', 'Spine'
                    ].map((joint, index) => (
                      <div key={joint}>
                        {joint}: {jointAngles[index]?.toFixed(1) || 'N/A'}°
                      </div>
                    ))}
                  </Box>
                ) : (
                  'No angles calculated'
                )}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Troubleshooting Tips */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Tips
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>Ensure good lighting and clear view of your full body</li>
          <li>Make sure webcam permissions are granted</li>
          <li>Try refreshing the page if MediaPipe fails to load</li>
          <li>Check browser console for detailed error messages</li>
          <li>Verify internet connection for MediaPipe CDN resources</li>
          <li>Stand 3-6 feet away from the camera for best detection</li>
          <li>Wear contrasting clothing against your background</li>
        </Box>
      </Paper>
    </Container>
  );
};

export default MediaPipeDebug; 