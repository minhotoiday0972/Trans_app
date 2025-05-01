# TransApp Frontend

Ứng dụng React Native để ghi âm, phiên âm, dịch và phát âm.

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Cài đặt Expo CLI (nếu chưa có)
npm install -g expo-cli
```

## Chạy ứng dụng

```bash
# Chạy ứng dụng
npm start

# Chạy với Expo Dev Client
npm run start:dev
```

## Quản lý URL API

Ứng dụng hỗ trợ nhiều cách để cấu hình URL API:

### 1. Sử dụng Firebase Realtime Database

Ứng dụng mặc định sẽ lấy URL API từ Firebase Realtime Database tại đường dẫn `config/apiUrl`. Khi URL thay đổi trong Firebase, ứng dụng sẽ tự động cập nhật mà không cần phải build lại.

### 2. Cập nhật URL trong Firebase

Sử dụng script để tự động cập nhật URL API trong Firebase từ tunnel ngrok:

```bash
# Chạy ngrok trước (trong terminal khác)
ngrok http 8000

# Cập nhật URL trong Firebase
npm run update-firebase-url
```

### 3. Sử dụng biến môi trường

Bạn có thể cập nhật URL API bằng cách tạo file `.env` với biến `EXPO_PUBLIC_API_URL`:

```bash
# Cập nhật từ ngrok
npm run update-env-urls

# Hoặc cập nhật từ IP máy chủ local
npm run update-env-ip
```

## Quy trình làm việc đề xuất

1. Chạy backend trên máy local
2. Tạo tunnel với ngrok: `ngrok http 8000`
3. Cập nhật URL trong Firebase: `npm run update-firebase-url`
4. Chạy ứng dụng: `npm start`

Khi URL API thay đổi, bạn chỉ cần cập nhật lại trong Firebase và ứng dụng sẽ tự động áp dụng mà không cần phải build lại.

## Build APK

```bash
# Build APK phát triển
npm run build:dev

# Build APK preview
npm run build:preview

# Build APK production
npm run build:prod
``` 