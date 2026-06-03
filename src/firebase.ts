import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTwEpTa8nklrMAQ63wIIAf9Ptvc7PCtlY",
  authDomain: "crv-mops-roadtrip-239.firebaseapp.com",
  databaseURL: "https://crv-mops-roadtrip-239-default-rtdb.firebaseio.com",
  projectId: "crv-mops-roadtrip-239",
  storageBucket: "crv-mops-roadtrip-239.firebasestorage.app",
  messagingSenderId: "875711689059",
  appId: "1:875711689059:web:e09a26b64677c704c16356"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Validates connection to Firestore as per skill guidelines
 */
async function testConnection() {
  try {
    // Only attempt if not being pre-rendered or in a weird environment
    if (typeof window !== 'undefined') {
      await getDocFromServer(doc(db, 'system', 'health'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Please check your configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInAnonymously = async () => {
  try {
    return await firebaseSignInAnonymously(auth);
  } catch (err: any) {
    console.error("Firebase Sign-in failed:", err);
    throw err;
  }
};

export const logout = async () => {
  return await auth.signOut();
};
