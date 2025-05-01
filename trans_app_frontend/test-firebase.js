import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

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

// Khởi tạo Firebase
console.log("Khởi tạo kết nối Firebase...");
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("Kết nối thành công với Firebase!");

// Hàm kiểm tra URL hợp lệ
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Hàm kiểm tra URL hoạt động
async function checkUrl(url) {
  try {
    console.log(`Kiểm tra URL ${url} có hoạt động không...`);
    const pingUrl = `${url}/api/v1/ping/`;
    console.log(`Gửi request đến: ${pingUrl}`);
    const response = await fetch(pingUrl, {
      method: 'GET',
      timeout: 5000
    });
    if (response.ok) {
      console.log(`✅ URL hoạt động! Mã trạng thái: ${response.status}`);
      return true;
    } else {
      console.log(`❌ URL trả về mã lỗi: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Lỗi khi kiểm tra URL: ${error.message}`);
    return false;
  }
}

// Hàm chính
async function testFirebase() {
  try {
    // Lấy URL từ Firebase
    const urlRef = ref(db, 'api_url');
    const snapshot = await get(urlRef);
    const apiUrl = snapshot.val();

    if (!apiUrl) {
      console.error("❌ Không tìm thấy URL API trong Firebase!");
      process.exit(1);
    }

    console.log(`URL API hiện tại trong Firebase: ${apiUrl}`);

    // Kiểm tra tính hợp lệ của URL
    if (!isValidUrl(apiUrl)) {
      console.error("❌ URL từ Firebase không hợp lệ!");
      process.exit(1);
    }

    // Kiểm tra xem URL có hoạt động không
    const isWorking = await checkUrl(apiUrl);
    if (isWorking) {
      console.log("URL từ Firebase ✅ hoạt động");
    } else {
      console.log("URL từ Firebase ❌ không hoạt động");
    }

    console.log("Kiểm tra Firebase thành công!");
    console.log("====== KẾT NỐI FIREBASE HOẠT ĐỘNG TỐT =====");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra Firebase:", error.message);
    process.exit(1);
  }
}

testFirebase();