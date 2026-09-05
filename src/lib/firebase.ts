import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  query, 
  orderBy, 
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalInteraction } from '../types';
import { sanitizeFirestorePayload } from './sanitizer';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId if configured
export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Google OAuth Provider for federated sign-in
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Ensure user profile record exists in user isolation root
    const userDocRef = doc(db, 'users', result.user.uid);
    await setDoc(
      userDocRef,
      sanitizeFirestorePayload({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLoginAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Save or update a journal interaction for the specific authenticated user.
 * Path: /users/{userId}/interactions/{interactionId}
 */
export async function saveJournalInteraction(userId: string, interaction: JournalInteraction): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to persist journal interactions.');
  }

  const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
  const cleanData = sanitizeFirestorePayload({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(interactionRef, cleanData, { merge: true });
}

/**
 * Load all journal interactions for the current user, ordered by most recent.
 */
export async function fetchUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) return [];

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));
  
  try {
    const snapshot = await getDocs(q);
    const items: JournalInteraction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as JournalInteraction;
      items.push({
        ...data,
        id: docSnap.id,
      });
    });
    return items;
  } catch (err: any) {
    // If the index on updatedAt is still warming up, fallback to simple collection query
    console.warn('Query with orderBy failed, falling back to base collection:', err?.message);
    const snapshot = await getDocs(interactionsRef);
    const items: JournalInteraction[] = [];
    snapshot.forEach((docSnap) => {
      items.push({
        ...(docSnap.data() as JournalInteraction),
        id: docSnap.id,
      });
    });
    // Sort client-side
    return items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }
}

/**
 * Delete a journal interaction by ID
 */
export async function deleteJournalInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) return;
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(interactionRef);
}
