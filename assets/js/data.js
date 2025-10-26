import { db, storage, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase.js';

// Site configuration stored in Firestore at collection "siteConfig", doc "v1"
const siteConfigCol = () => collection(db, 'siteConfig');
const siteConfigDoc = () => doc(siteConfigCol(), 'v1');

export async function getSiteConfig(){
  const snap = await getDoc(siteConfigDoc());
  return snap.exists() ? snap.data() : null;
}

export async function saveSiteConfig(config){
  await setDoc(siteConfigDoc(), config, { merge: true });
}

export function onSiteConfigSnapshot(callback){
  return onSnapshot(siteConfigDoc(), (doc)=> callback(doc.exists() ? doc.data() : null));
}

// Portfolio
const portfolioCol = () => collection(db, 'portfolioItems');
export async function getPortfolioItems(){
  const q = query(portfolioCol(), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d=> ({ id: d.id, ...d.data() }));
}
export async function addPortfolioItem(item){
  const enriched = { ...item, createdAt: serverTimestamp() };
  const docRef = await addDoc(portfolioCol(), enriched);
  return docRef.id;
}
export async function updatePortfolioItem(id, data){
  await updateDoc(doc(portfolioCol(), id), data);
}
export async function deletePortfolioItem(id){
  await deleteDoc(doc(portfolioCol(), id));
}

// File upload (Storage)
export async function uploadImage(file, path){
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
}

// Messages / Chat
const messagesCol = () => collection(db, 'messages');
export async function addMessage(message){
  await addDoc(messagesCol(), { ...message, timestamp: serverTimestamp() });
}
export function onMessagesSnapshot(callback){
  const q = query(messagesCol(), orderBy('timestamp','asc'));
  return onSnapshot(q, (snap)=> {
    callback(snap.docs.map(d=> ({ id: d.id, ...d.data() })));
  });
}
