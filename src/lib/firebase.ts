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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize client Firebase app
const clientApp = initializeClientApp(clientConfig);
export const clientAuth = getClientAuth(clientApp);
export const clientDb = getClientFirestore(clientApp);
export const clientStorage = getClientStorage(clientApp);

// Interface para configuração de marca d'água
export interface WatermarkConfig {
  enabled: boolean;
  logoUrl: string;
  opacity: number;
  position: string;
  size: number;
}

// Função para aplicar marca d'água em uma imagem
export const applyWatermark = async (
  imageUrl: string,
  watermarkConfig: WatermarkConfig
): Promise<string> => {
  if (!watermarkConfig.enabled || !watermarkConfig.logoUrl) {
    return imageUrl;
  }

  try {
    // Carrega as imagens em um Canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível criar contexto Canvas");

    // Carrega a imagem principal
    const mainImage = new Image();
    mainImage.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      mainImage.onload = () => resolve();
      mainImage.onerror = () => reject(new Error("Falha ao carregar imagem principal"));
      mainImage.src = imageUrl;
    });

    // Configura o canvas com o tamanho da imagem
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;
    ctx.drawImage(mainImage, 0, 0);

    // Carrega a logo marca d'água
    const logoImage = new Image();
    logoImage.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      logoImage.onload = () => resolve();
      logoImage.onerror = () => reject(new Error("Falha ao carregar logo"));
      logoImage.src = watermarkConfig.logoUrl;
    });

    // Configura a transparência
    ctx.globalAlpha = watermarkConfig.opacity;

    // Calcula o tamanho do logo
    const watermarkWidth = (mainImage.width * watermarkConfig.size) / 100;
    const watermarkHeight = (logoImage.height / logoImage.width) * watermarkWidth;

    // Determina a posição
    let x = 0;
    let y = 0;

    switch (watermarkConfig.position) {
      case "top-left":
        x = 20;
        y = 20;
        break;
      case "top-right":
        x = mainImage.width - watermarkWidth - 20;
        y = 20;
        break;
      case "bottom-left":
        x = 20;
        y = mainImage.height - watermarkHeight - 20;
        break;
      case "bottom-right":
        x = mainImage.width - watermarkWidth - 20;
        y = mainImage.height - watermarkHeight - 20;
        break;
      case "center":
        x = (mainImage.width - watermarkWidth) / 2;
        y = (mainImage.height - watermarkHeight) / 2;
        break;
    }

    // Desenha a marca d'água
    ctx.drawImage(logoImage, x, y, watermarkWidth, watermarkHeight);

    // Retorna imagem com marca d'água como data URL
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (error) {
    console.error("Erro ao aplicar marca d'água:", error);
    return imageUrl; // Retorna a imagem original em caso de erro
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
