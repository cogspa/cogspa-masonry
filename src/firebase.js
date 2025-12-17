import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FB_APP_ID,
};

// Safeguard: Check if config is valid
const isConfigured = !!firebaseConfig.apiKey;

let app;
let auth;
let googleProvider;
let db;
let storage;

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    console.warn("Firebase credentials missing in .env");
}

export { auth, googleProvider, db, storage, isConfigured };
