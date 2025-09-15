import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../env';

const app = initializeApp(FIREBASE_CONFIG);
const storage = getStorage(app);
const db = getFirestore(app);

// Use default auth - Firebase v9+ handles persistence automatically
const auth = getAuth(app);

export { app, storage, db, auth };
