const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function fetchNgrokUrl(maxRetries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch('http://localhost:4040/api/tunnels');
            if (!response.ok) {
                throw new Error(`Ngrok API trả về lỗi: ${response.status}`);
            }
            const data = await response.json();
            const tunnels = data.tunnels || [];
            let ngrokUrl = null;

            for (const tunnel of tunnels) {
                if (tunnel.proto === 'https') {
                    ngrokUrl = tunnel.public_url;
                    break;
                }
            }

            if (!ngrokUrl) {
                throw new Error('Không tìm thấy ngrok URL với giao thức HTTPS.');
            }

            return ngrokUrl;
        } catch (error) {
            console.error(`Lần thử ${attempt}/${maxRetries} thất bại: ${error.message}`);
            if (attempt === maxRetries) {
                throw new Error('Không thể lấy ngrok URL sau nhiều lần thử.');
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function updateNgrokUrl() {
    try {
        // Lấy ngrok URL
        const ngrokUrl = await fetchNgrokUrl();
        const apiUrl = `${ngrokUrl}/api/v1/`;
        
        // Đọc file .env hiện có (nếu tồn tại)
        const envPath = path.resolve(__dirname, '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, { encoding: 'utf8' });
        }

        // Tìm và cập nhật EXPO_PUBLIC_API_URL
        const lines = envContent.split('\n').filter(line => line.trim() !== '');
        let updated = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('EXPO_PUBLIC_API_URL=')) {
                lines[i] = `EXPO_PUBLIC_API_URL=${apiUrl}`;
                updated = true;
                break;
            }
        }
        if (!updated) {
            lines.push(`EXPO_PUBLIC_API_URL=${apiUrl}`);
        }

        // Ghi lại file .env
        fs.writeFileSync(envPath, lines.join('\n') + '\n', { encoding: 'utf8' });
        console.log(`Đã cập nhật .env: EXPO_PUBLIC_API_URL=${apiUrl}`);
    } catch (error) {
        console.error('Lỗi khi lấy ngrok URL:', error.message);
        console.error('Sử dụng giá trị mặc định trong mã nguồn.');
    }
}

updateNgrokUrl();