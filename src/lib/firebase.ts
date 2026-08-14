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
  projectId: rawConfig.projectId || "gen-lang-client-0785272696",
  appId: rawConfig.appId || "1:43970059143:web:2ee5632b527f5f74fe9122",
  apiKey: rawConfig.apiKey || "AIzaSyA9h-DQkd60vi1ROvocQzfOaUHP4XGxIdA",
  authDomain: rawConfig.authDomain || "gen-lang-client-0785272696.firebaseapp.com",
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || "ai-studio-clinicproegyptde-9cbae89b-76e3-4580-b646-f3116460b2bd",
  storageBucket: rawConfig.storageBucket || "gen-lang-client-0785272696.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId || "43970059143"
};

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Initialize Firestore safely
let firestoreInstance;
try {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
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
