import pickle
from sklearn.preprocessing import LabelEncoder

def main():
    # Define the exact class names from our high-accuracy model
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
    
    # Create and fit the label encoder
    label_encoder = LabelEncoder()
    label_encoder.fit(target_names)
    
    # Save the label encoder
    output_path = 'd:/models/label_encoder.pkl'
    with open(output_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    
    print(f"Label encoder successfully saved to {output_path}")
    print("\nClass mapping:")
    for i, class_name in enumerate(label_encoder.classes_):
        print(f"{i}: {class_name}")

if __name__ == '__main__':
    main()
