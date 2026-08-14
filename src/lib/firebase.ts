import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Default robust Firebase config with applet values
const rawConfig = (firebaseAppletConfig as any) || {};

export const firebaseConfig = {
  projectId: rawConfig.projectId || "clinical-mang",
  appId: rawConfig.appId || "1:617272364959:web:432a393e7f295c7051f7aa",
  apiKey: rawConfig.apiKey || "AIzaSyBs8hFhSfVhJ1dyNOATBb9JlNw6cBSSsZI",
  authDomain: rawConfig.authDomain || "clinical-mang.firebaseapp.com",
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || "(default)",
  storageBucket: rawConfig.storageBucket || "clinical-mang.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId || "617272364959",
  measurementId: rawConfig.measurementId || "G-R84XYVDZMK"
};

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Initialize Firestore safely
let firestoreInstance;
try {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  firestoreInstance = (databaseId && databaseId !== '(default)') ? getFirestore(app, databaseId) : getFirestore(app);
} catch (e) {
  console.warn('Firestore fallback init:', e);
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;


export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
}

// Validation check on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    // Offline mode or rules active
    return false;
  }
}
