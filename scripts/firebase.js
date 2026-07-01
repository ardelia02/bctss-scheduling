import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: atob("QUl6YVN5QVc4OGwtZFY0cEsxa3F4ZE5CTlo2NE9DUjlNSjBOaXZ3"),
  authDomain: "bct-scheduling-6c695.firebaseapp.com",
  projectId: "bct-scheduling-6c695",
  storageBucket: "bct-scheduling-6c695.firebasestorage.app",
  messagingSenderId: "974635035338",
  appId: "1:974635035338:web:a2f2b55b87b8a3a5526233",
  measurementId: "G-TW0TDW8TD2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, doc, setDoc, getDocs, onSnapshot, deleteDoc };
