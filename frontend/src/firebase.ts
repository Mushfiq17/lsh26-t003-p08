import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  type User
} from "firebase/auth";
import { getDatabase, ref, set as setRTDB, update as updateRTDB } from "firebase/database";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfZIMeqHEYogd9K0iBrQpNAOv5sltFVXg",
  authDomain: "student-4d01f.firebaseapp.com",
  databaseURL: "https://student-4d01f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "student-4d01f",
  storageBucket: "student-4d01f.firebasestorage.app",
  messagingSenderId: "88387304735",
  appId: "1:88387304735:web:e5c3e0420181062196042a",
  measurementId: "G-VX2L6XJFTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Explicitly set browser-based local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Firebase auth persistence configuration failed:", err);
});

// Realtime Database & Firestore Initializations
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth helpers
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const logout = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

// Realtime DB & Firestore Dual Sync Helpers
export const saveStudentToFirebase = async (studentData: any) => {
  const timestamp = new Date().toISOString();
  const payload = { ...studentData, synced_at: timestamp };

  // 1. Realtime Database
  try {
    const studentRef = ref(db, `students/${studentData.student_id}`);
    await setRTDB(studentRef, payload);
  } catch (err: any) {
    console.warn("Realtime DB write warning:", err?.message);
  }

  // 2. Firestore Database
  try {
    const firestoreRef = doc(firestore, "students", String(studentData.student_id));
    await setDoc(firestoreRef, payload, { merge: true });
    console.log("✅ Firestore: student saved", studentData.student_id);
  } catch (err: any) {
    console.warn("Firestore write warning:", err?.message);
  }
};

export const saveBatchToFirebase = async (students: any[]) => {
  if (!students || students.length === 0) return;
  const timestamp = new Date().toISOString();

  // 1. Realtime Database Batch Update
  try {
    const updates: Record<string, any> = {};
    students.forEach((student) => {
      updates[`students/${student.student_id}`] = {
        ...student,
        synced_at: timestamp
      };
    });
    await updateRTDB(ref(db), updates);
    console.log(`✅ Realtime DB: batch saved (${students.length} students)`);
  } catch (err: any) {
    console.warn("Realtime DB batch write warning:", err?.message);
  }

  // 2. Firestore Batch Write
  try {
    const batch = writeBatch(firestore);
    students.forEach((student) => {
      const docRef = doc(firestore, "students", String(student.student_id));
      batch.set(docRef, { ...student, synced_at: timestamp }, { merge: true });
    });
    await batch.commit();
    console.log(`✅ Firestore: batch saved (${students.length} students)`);
  } catch (err: any) {
    console.warn("Firestore batch write warning:", err?.message);
  }
};

export type { User };
