import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (e.g. "timelog-app")
// 3. Add a Web App (</> icon)
// 4. Copy the "firebaseConfig" object
// 5. Replace the values below with YOUR config
// ------------------------------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyBsLiPqgz15mmkDdooswtpBITTLyy8EA8E",
    authDomain: "timelog-e6922.firebaseapp.com",
    projectId: "timelog-e6922",
    storageBucket: "timelog-e6922.firebasestorage.app",
    messagingSenderId: "680232483390",
    appId: "1:680232483390:web:d62e8a57d85ee1ff952f6f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Offline Persistence
// Enable Offline Persistence
// enableIndexedDbPersistence(db).catch((err) => {
//     if (err.code == 'failed-precondition') {
//         console.warn('Persistence failed: Multiple tabs open');
//     } else if (err.code == 'unimplemented') {
//         console.warn('Persistence not supported by browser');
//     }
// });

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');
export { auth, db };
