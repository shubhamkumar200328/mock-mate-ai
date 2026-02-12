import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBYuIf0Jr1YJuqYgwH2ixMBCwntBwz2uCE',
  authDomain: 'mockmateai-1d27f.firebaseapp.com',
  projectId: 'mockmateai-1d27f',
  storageBucket: 'mockmateai-1d27f.firebasestorage.app',
  messagingSenderId: '850856902001',
  appId: '1:850856902001:web:2d3100a49c197f6535cad0',
  measurementId: 'G-7DHQ8WF79R',
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
