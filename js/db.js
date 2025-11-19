import { db, doc, getDoc, setDoc, updateDoc, runTransaction, collection, query, where, getDocs } from './firebase.js';

export async function readDoc(path, id) {
  try {
    const snap = await getDoc(doc(db, path, id));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn(`Falha ao ler ${path}/${id}`, error);
    return null;
  }
}

export async function writeDoc(path, id, data) {
  await setDoc(doc(db, path, id), data, { merge: true });
}

export async function tx(callback) {
  return runTransaction(db, callback);
}

export async function listChatsFor(uid) {
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
  const res = await getDocs(q);
  return res.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchLayout(tattooerUid, fallback) {
  const data = await readDoc('portfolio', tattooerUid);
  return data?.layout || fallback();
}

export async function saveLayout(tattooerUid, layout) {
  const timestamp = Date.now();
  await writeDoc('portfolio', tattooerUid, {
    layout,
    updatedAt: timestamp
  });
  await writeDoc('portfolio', 'public', {
    publishedUid: tattooerUid,
    updatedAt: timestamp
  });
}

export async function saveAvailability(tattooerUid, slots) {
  await writeDoc('availability', tattooerUid, { slots, updatedAt: Date.now() });
}

export async function readAvailability(tattooerUid) {
  return (await readDoc('availability', tattooerUid))?.slots || [];
}
