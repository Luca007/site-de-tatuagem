import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { getAuth, type Auth } from "firebase-admin/auth";

import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth as getClientAuth } from "firebase/auth";
import { getFirestore as getClientFirestore } from "firebase/firestore";
import { getStorage as getClientStorage } from "firebase/storage";

// Client-side Firebase configuration
const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize client Firebase app
const clientApp = initializeClientApp(clientConfig);
export const clientAuth = getClientAuth(clientApp);
export const clientDb = getClientFirestore(clientApp);
export const clientStorage = getClientStorage(clientApp);

// Server-side Firebase admin configuration
let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;
let adminStorage: Storage | undefined;

// Only initialize admin SDK on the server side
if (typeof window === "undefined" && getApps().length === 0) {
  try {
    // For production environment with proper credentials
    if (process.env.FIREBASE_ADMIN_CREDENTIAL) {
      adminApp = initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    // For development environment
    else {
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    adminStorage = getStorage(adminApp);
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export { adminDb, adminAuth, adminStorage };
