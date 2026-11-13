const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {
  if (initialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
    return;
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON — push notifications disabled');
    return;
  }
  if (!serviceAccount.project_id) {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON missing project_id — push notifications disabled');
    return;
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialized = true;
  console.log('Firebase Admin initialized');
}

module.exports = { admin, initFirebase };
