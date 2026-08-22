import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCD_eUJWp3QkYiJuUpQJoriOwIdFAj8_NY",
  authDomain: "codeaid-ml.firebaseapp.com",
  projectId: "codeaid-ml",
  storageBucket: "codeaid-ml.firebasestorage.app",
  messagingSenderId: "1041928185140",
  appId: "1:1041928185140:web:cb566bd7741f3a2b58f161",
  measurementId: "G-BPQ0NYDQXK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
