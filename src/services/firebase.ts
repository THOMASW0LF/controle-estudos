// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxluYvTQzaXnZOJIKHXTG4ycGYs5gdC-I",
  authDomain: "estudos-8f849.firebaseapp.com",
  projectId: "estudos-8f849",
  storageBucket: "estudos-8f849.firebasestorage.app",
  messagingSenderId: "1060653869317",
  appId: "1:1060653869317:web:ed246eae442d40506a6f6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);