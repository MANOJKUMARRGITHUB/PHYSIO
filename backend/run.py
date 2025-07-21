#!/usr/bin/env python3
"""
PhysioTracker Backend Runner
Simple script to start the Flask backend server
"""

import os
import sys
from app import app, load_models

def main():
    print("=" * 60)
    print("PhysioTracker - AI Exercise Monitoring Backend")
    print("=" * 60)
    
    # Check if model files exist
    if not os.path.exists('model/model.h5'):
        print("❌ ERROR: BiLSTM model file not found!")
        print("   Please ensure 'model.h5' is in the backend/model directory")
        sys.exit(1)
    
    if not os.path.exists('model/label_encoder.pkl'):
        print("❌ ERROR: Label encoder file not found!")
        print("   Please ensure 'label_encoder.pkl' is in the backend/model directory")
        sys.exit(1)
    
    print("✅ Model files found")
    
    # Load models
    print("🔄 Loading AI models...")
    if not load_models():
        print("❌ ERROR: Failed to load models")
        sys.exit(1)
    
    print("✅ Models loaded successfully")
    print("🚀 Starting Flask server...")
    print("   Backend will be available at: http://localhost:5000")
    print("   Press Ctrl+C to stop the server")
    print("=" * 60)
    
    # Start Flask app
    try:
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            use_reloader=False  # Disable reloader to prevent double loading
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 