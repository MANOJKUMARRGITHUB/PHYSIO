import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.metrics import classification_report
import pickle
import os

def load_test_data():
    """Load the test data and labels."""
    processed_dir = 'd:/models/processed'
    X_test = np.load(os.path.join(processed_dir, 'X_test_clean.npy'), allow_pickle=True)
    y_test = np.load(os.path.join(processed_dir, 'y_test_clean.npy'), allow_pickle=True)
    return X_test, y_test

def load_label_encoder():
    """Load the label encoder."""
    with open('d:/models/label_encoder.pkl', 'rb') as f:
        return pickle.load(f)

def main():
    print("Testing the trained model...")
    
    # Load the model
    print("Loading model...")
    model = load_model('d:/models/model.h5')
    
    # Load test data
    print("Loading test data...")
    X_test, y_test = load_test_data()
    
    # Load label encoder
    print("Loading label encoder...")
    label_encoder = load_label_encoder()
    
    # Make predictions
    print("Making predictions...")
    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    # Generate classification report
    print("\n--- Test Set Classification Report ---")
    print(classification_report(y_test, y_pred_classes, 
                              target_names=label_encoder.classes_))
    
    # Calculate and print accuracy
    accuracy = np.mean(y_pred_classes == y_test)
    print(f"\nTest Set Accuracy: {accuracy:.4f}")
    
    # Show some example predictions
    print("\nSample predictions:")
    for i in range(5):
        true_label = label_encoder.inverse_transform([y_test[i]])[0]
        pred_label = label_encoder.inverse_transform([y_pred_classes[i]])[0]
        confidence = np.max(y_pred[i])
        print(f"Sample {i+1}: Predicted '{pred_label}' (Confidence: {confidence:.2f}), Actual: '{true_label}'")

def test_model():
    # 1. Load the model and label encoder
    print("Loading model and label encoder...")
    model = load_model('model.h5')
    with open('label_encoder.pkl', 'rb') as f:
        label_encoder = pickle.load(f)
    
    print("\n=== Model Summary ===")
    model.summary()
    
    # 2. Create a test input with the correct shape (1, 30, 99)
    test_input = np.zeros((1, 30, 99), dtype=np.float32)  # Using zeros as test input
    
    # 3. Make predictions
    print("\n=== Making Test Prediction ===")
    predictions = model.predict(test_input)
    
    print(f"Input shape: {test_input.shape}")
    print(f"Output shape: {predictions.shape}")
    print(f"Predictions (raw): {predictions}")
    
    # 4. Get class predictions
    predicted_class_idx = np.argmax(predictions[0])
    confidence = np.max(predictions[0])
    class_name = label_encoder.inverse_transform([predicted_class_idx])[0]
    
    print(f"\nPredicted class: {class_name}")
    print(f"Confidence: {confidence:.4f}")
    
    # 5. Print all class probabilities
    print("\nClass Probabilities:")
    for i, prob in enumerate(predictions[0]):
        print(f"{label_encoder.classes_[i]}: {prob:.4f}")

if __name__ == '__main__':
    main()
    test_model()
