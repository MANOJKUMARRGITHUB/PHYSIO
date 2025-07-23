import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Bidirectional, Dropout, Masking
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
import os
import pickle

# --- Configuration ---
PROCESSED_DIR = 'd:/models/processed'
MODEL_PATH = 'd:/models/model.h5'
REPORT_PATH = os.path.join(PROCESSED_DIR, 'classification_report.txt')

# --- Main Training Logic ---
def main():
    print("Attempting to reproduce 99% accuracy with original cleaned files...")

    # 1. Load the original cleaned data files
    print(f"Loading data from {PROCESSED_DIR}...")
    X_train = np.load(os.path.join(PROCESSED_DIR, 'X_train_clean.npy'), allow_pickle=True)
    y_train = np.load(os.path.join(PROCESSED_DIR, 'y_train_clean.npy'), allow_pickle=True)
    X_val = np.load(os.path.join(PROCESSED_DIR, 'X_val_clean.npy'), allow_pickle=True)
    y_val = np.load(os.path.join(PROCESSED_DIR, 'y_val_clean.npy'), allow_pickle=True)
    X_test = np.load(os.path.join(PROCESSED_DIR, 'X_test_clean.npy'), allow_pickle=True)
    y_test = np.load(os.path.join(PROCESSED_DIR, 'y_test_clean.npy'), allow_pickle=True)

    # 2. Recreate the Label Encoder from the desired output
    # These are the exact 9 classes from the high-accuracy report.
    target_names = [
        'barbell biceps curl',
        'bench press',
        'chest fly machine',
        'deadlift',
        'decline bench press_dbp',
        'hammer curl',
        'hip thrust',
        'incline bench press',
        'lat pulldown'
    ]
    label_encoder = LabelEncoder()
    label_encoder.fit(target_names)
    num_classes = len(label_encoder.classes_)
    print(f"Successfully set up encoder for {num_classes} classes.")
    
    # Save the label encoder for future use
    label_encoder_path = os.path.join(os.path.dirname(MODEL_PATH), 'label_encoder.pkl')
    with open(label_encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"Label encoder saved to {label_encoder_path}")

    # 3. Prepare Data for Model
    y_train_one_hot = tf.keras.utils.to_categorical(y_train, num_classes=num_classes)
    y_val_one_hot = tf.keras.utils.to_categorical(y_val, num_classes=num_classes)
    input_shape = (X_train.shape[1], X_train.shape[2])

    # 4. Build a Powerful Model
    print("Building a powerful Bi-LSTM model...")
    model = Sequential([
        Masking(mask_value=0., input_shape=input_shape),
        Bidirectional(LSTM(256, return_sequences=True)),
        Dropout(0.5),
        Bidirectional(LSTM(128)),
        Dropout(0.5),
        Dense(128, activation='relu'),
        Dense(64, activation='relu'),
        Dense(num_classes, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.summary()

    # 5. Train the Model
    print("\nTraining model...")
    checkpoint = ModelCheckpoint(MODEL_PATH, monitor='val_accuracy', save_best_only=True, mode='max', verbose=1)
    early_stopping = EarlyStopping(monitor='val_accuracy', patience=20, mode='max', verbose=1, restore_best_weights=True)

    history = model.fit(X_train, y_train_one_hot,
                        epochs=200,
                        batch_size=32,
                        validation_data=(X_val, y_val_one_hot),
                        callbacks=[checkpoint, early_stopping])

    # 6. Evaluate and Save Report
    print("\nEvaluating model on the test set...")
    y_pred_probs = model.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)

    report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)
    print("--- Final Classification Report ---")
    print(report)

    with open(REPORT_PATH, 'w') as f:
        f.write(report)

    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Report saved to {REPORT_PATH}")

if __name__ == '__main__':
    main()
