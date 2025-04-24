import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZeKkseRlQOPJEY_A0E4GvKTRKAdodBOE",
  authDomain: "transapp-f4ceb.firebaseapp.com",
  databaseURL: "https://transapp-f4ceb-default-rtdb.firebaseio.com",
  projectId: "transapp-f4ceb",
  storageBucket: "transapp-f4ceb.firebasestorage.app",
  messagingSenderId: "881920241115",
  appId: "1:881920241115:android:3bbac352315710eaa84bfe"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;