// lib/firebaseAdmin.js
import admin from 'firebase-admin';

// Securely import the service account key only on the server
const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed.", error);
    }
}

const adminDb = admin.firestore();
export { adminDb };