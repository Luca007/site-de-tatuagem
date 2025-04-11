import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { getAuth, type Auth } from "firebase-admin/auth";

import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth as getClientAuth } from "firebase/auth";
import { getFirestore as getClientFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
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

// Firestore collection references
const portfolioItemsCollection = collection(clientDb, "portfolioItems");
const clientMessagesCollection = collection(clientDb, "clientMessages");

// CRUD operations for portfolio items
export const addPortfolioItem = async (item) => {
  try {
    const docRef = await addDoc(portfolioItemsCollection, item);
    return docRef.id;
  } catch (error) {
    console.error("Error adding portfolio item: ", error);
    throw error;
  }
};

export const getPortfolioItems = async () => {
  try {
    const querySnapshot = await getDocs(portfolioItemsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting portfolio items: ", error);
    throw error;
  }
};

export const updatePortfolioItem = async (id, updatedItem) => {
  try {
    const docRef = doc(clientDb, "portfolioItems", id);
    await updateDoc(docRef, updatedItem);
  } catch (error) {
    console.error("Error updating portfolio item: ", error);
    throw error;
  }
};

export const deletePortfolioItem = async (id) => {
  try {
    const docRef = doc(clientDb, "portfolioItems", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting portfolio item: ", error);
    throw error;
  }
};

// CRUD operations for client messages
export const addClientMessage = async (message) => {
  try {
    const docRef = await addDoc(clientMessagesCollection, message);
    return docRef.id;
  } catch (error) {
    console.error("Error adding client message: ", error);
    throw error;
  }
};

export const getClientMessages = async () => {
  try {
    const querySnapshot = await getDocs(clientMessagesCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting client messages: ", error);
    throw error;
  }
};

export const updateClientMessage = async (id, updatedMessage) => {
  try {
    const docRef = doc(clientDb, "clientMessages", id);
    await updateDoc(docRef, updatedMessage);
  } catch (error) {
    console.error("Error updating client message: ", error);
    throw error;
  }
};

export const deleteClientMessage = async (id) => {
  try {
    const docRef = doc(clientDb, "clientMessages", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting client message: ", error);
    throw error;
  }
};

// Real-time updates for client messages
export const onClientMessagesSnapshot = (callback) => {
  try {
    const q = query(clientMessagesCollection, orderBy("timestamp", "desc"));
    return onSnapshot(q, callback);
  } catch (error) {
    console.error("Error setting up client messages snapshot listener: ", error);
    throw error;
  }
};

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
