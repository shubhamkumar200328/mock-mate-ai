// import { initializeApp, getApps, cert } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth';
// import { getFirestore } from 'firebase-admin/firestore';

// const initFirebaseAdmin = () => {
//   const apps = getApps();

//   if (!apps.length) {
//     initializeApp({
//       credential: cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         // The fix: Standard regex replacement for newlines
//         privateKey: process.env.FIREBASE_PRIVATE_KEY
//           ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
//           : undefined,
//       }),
//     });
//   }

//   return {
//     auth: getAuth(),
//     db: getFirestore(),
//   };
// };

// export const { auth, db } = initFirebaseAdmin();

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Check if the environment variables are actually loaded
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY is not defined in .env.local');
}

const initFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      ?.replace(/\r/g, '')
      ?.trim();

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
};

export const { auth, db } = initFirebaseAdmin();
