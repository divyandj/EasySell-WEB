import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANxQ7336Pa_sNu1qO5HI12TUWrFg_SIn8",
  authDomain: "easysell-hashu.firebaseapp.com",
  projectId: "easysell-hashu",
  storageBucket: "easysell-hashu.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const ref = doc(db, 'catalogues', '4gWvgOu3E1YQLEbCkLGR', 'orders', '4Bt5gvPDRXFdSPtEldhS');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log(JSON.stringify(snap.data(), null, 2));
  } else {
    console.log('Document not found');
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
