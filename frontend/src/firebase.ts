import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyBRqLoD5OxK1ntWyCxfQ5YbCjGdJbzXysk",
  authDomain: "physiotherapy-project-89483.firebaseapp.com",
  projectId: "physiotherapy-project-89483",
  storageBucket: "physiotherapy-project-89483.firebasestorage.app",
  messagingSenderId: "179471855233",
  appId: "1:179471855233:web:737ba82fec025fa4f36780"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app; 