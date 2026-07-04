// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB01-MWSZl4Us-XUyXEfeLQjgxUHEUtpQM",
  authDomain: "training-log-app-d219c.firebaseapp.com",
  projectId: "training-log-app-d219c",
  storageBucket: "training-log-app-d219c.firebasestorage.app",
  messagingSenderId: "962315651869",
  appId: "1:962315651869:web:9ed712ea04a815d3d6eff4"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
export const db = getFirestore(app);
