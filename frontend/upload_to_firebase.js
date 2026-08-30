import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration from src/firebase.ts
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
const db = getDatabase(app);
const firestore = getFirestore(app);

async function uploadData() {
  console.log("Reading P08_school_results_public.json file...");
  const jsonPath = path.join(__dirname, '..', 'P08_school_results_public.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);

  console.log("1. Uploading data to Firebase Realtime Database...");
  const dbRef = ref(db, 'p08_school_results');
  
  try {
    await set(dbRef, data);
    console.log("✅ Realtime Database upload successful!");
  } catch (error) {
    console.warn("⚠️ Realtime Database upload skipped/failed:", error.message);
  }

  console.log("2. Uploading data to Firebase Firestore...");
  try {
    // Upload cases to Firestore collection 'p08_cases'
    const cases = data.cases || [];
    console.log(`Uploading ${cases.length} benchmark test cases to Firestore...`);
    for (const c of cases) {
      const caseRef = doc(firestore, 'p08_cases', c.case_id);
      await setDoc(caseRef, c, { merge: true });
      
      // Upload individual students from each case to Firestore collection 'students'
      const students = c.students || [];
      if (students.length > 0) {
        const batch = writeBatch(firestore);
        for (const s of students) {
          const studentDocRef = doc(firestore, 'students', s.id);
          batch.set(studentDocRef, { ...s, case_id: c.case_id }, { merge: true });
        }
        await batch.commit();
      }
    }
    console.log("✅ Firestore database upload successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Firestore upload failed:", error.message);
    process.exit(1);
  }
}

uploadData();
