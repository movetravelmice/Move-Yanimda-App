import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDkqUpXDoxxt5_-erUYAwg5rhcoPFFXl4Y",
  authDomain: "move-yanimda.firebaseapp.com",
  projectId: "move-yanimda",
  storageBucket: "move-yanimda.firebasestorage.app",
  messagingSenderId: "830935984877",
  appId: "1:830935984877:web:a46e5c12c9a3bd06f4bae4",
  measurementId: "G-VMBK53MFSR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
