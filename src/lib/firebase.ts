import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyASkAuWtID5zx2OEBM7-7JQhqaK1x_ewyw',
  authDomain: 'razorgate-demo.firebaseapp.com',
  projectId: 'razorgate-demo',
  storageBucket: 'razorgate-demo.firebasestorage.app',
  messagingSenderId: '672474401913',
  appId: '1:672474401913:web:7c56cfdd828ca1e0e698a8',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
