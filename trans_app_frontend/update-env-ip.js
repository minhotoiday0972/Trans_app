const fs = require('fs');
const path = require('path');
const os = require('os'); // Thêm module os để lấy địa chỉ IP

async function updateIpAddress() {
    try {
        // Lấy danh sách các giao diện mạng
        const networkInterfaces = os.networkInterfaces();
        let ipAddress = null;

        // Duyệt qua các giao diện mạng để tìm IPv4
        for (const interfaceName in networkInterfaces) {
            const interfaces = networkInterfaces[interfaceName];
            for (const iface of interfaces) {
                // Chỉ lấy địa chỉ IPv4, bỏ qua IPv6 và địa chỉ loopback (127.0.0.1)
                if (iface.family === 'IPv4' && !iface.internal) {
                    ipAddress = iface.address;
                    break;
                }
            }
            if (ipAddress) break;
        }

        if (!ipAddress) {
            console.error('Không tìm thấy địa chỉ IPv4. Đảm bảo máy đã kết nối mạng.');
            return;
        }

        // Tạo giá trị EXPO_PUBLIC_API_URL với IP vừa lấy được
        const apiUrl = `http://${ipAddress}:8000/api/v1/`;
        const envContent = `EXPO_PUBLIC_API_URL=${apiUrl}\n`;

        // Ghi vào file .env
        const envPath = path.resolve(__dirname, '.env');
        fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
        console.log(`Đã cập nhật .env: EXPO_PUBLIC_API_URL=${apiUrl}`);
    } catch (error) {
        console.error('Lỗi khi lấy địa chỉ IP:', error.message);
        console.error('Sử dụng giá trị mặc định trong mã nguồn.');
    }
}

// Gọi hàm để cập nhật
updateIpAddress();