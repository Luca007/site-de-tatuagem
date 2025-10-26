import { auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, fbSignOut, onAuthStateChanged } from './firebase.js';

export function observeAuth(callback){
  return onAuthStateChanged(auth, (user)=> callback(user));
}

export async function loginWithEmail(email, password){
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function registerWithEmail(email, password){
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  return user;
}

export async function loginWithGoogle(){
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout(){
  await fbSignOut(auth);
}
