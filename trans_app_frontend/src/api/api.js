const api = {
  ensureApiUrl(apiUrl) {
    if (!apiUrl) throw new Error('apiUrl không được cung cấp');
    if (typeof apiUrl !== 'string') throw new Error('apiUrl phải là chuỗi');
    try {
      new URL(apiUrl); // Kiểm tra URL hợp lệ
    } catch {
      throw new Error('apiUrl không hợp lệ');
    }
    return apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
  },

  async fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error.name === 'AbortError' 
        ? new Error('Yêu cầu hết thời gian')
        : error;
    }
  },

  async transcribeAudio(uri, apiUrl) {
    try {
      // Kiểm tra URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('URI của file âm thanh không hợp lệ');
      }

      // Kiểm tra apiUrl
      const baseUrl = this.ensureApiUrl(apiUrl);

      // Tạo FormData để gửi file âm thanh
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/wav',
        name: 'audio.wav',
      });

      // Gửi yêu cầu
      const response = await this.fetchWithTimeout(`${baseUrl}transcribe/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      // Kiểm tra lỗi từ server
      if (!response.ok) {
        throw new Error(data.error || `Lỗi server: ${response.status}`);
      }
      if (data.error) {
        throw new Error(data.error);
      }

      // Kiểm tra dữ liệu trả về
      if (!data.transcription || typeof data.transcription !== 'string') {
        throw new Error('Dữ liệu phiên âm không hợp lệ');
      }

      return data.transcription;
    } catch (error) {
      const errorMessage = error.message || 'Không thể phiên âm âm thanh';
      console.error('Error in transcribeAudio:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async translateText(text, apiUrl) {
    try {
      // Kiểm tra văn bản đầu vào
      if (!text || typeof text !== 'string') {
        throw new Error('Văn bản đầu vào không hợp lệ');
      }

      // Kiểm tra apiUrl
      const baseUrl = this.ensureApiUrl(apiUrl);

      // Gửi yêu cầu
      const response = await this.fetchWithTimeout(`${baseUrl}translate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      // Kiểm tra lỗi từ server
      if (!response.ok) {
        throw new Error(data.error || `Lỗi server: ${response.status}`);
      }
      if (data.error) {
        throw new Error(data.error);
      }

      // Kiểm tra dữ liệu trả về
      if (!data.translation || typeof data.translation !== 'string') {
        throw new Error('Dữ liệu dịch không hợp lệ');
      }

      return data.translation;
    } catch (error) {
      const errorMessage = error.message || 'Không thể dịch văn bản';
      console.error('Error in translateText:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async textToSpeech(text, apiUrl) {
    try {
      // Kiểm tra văn bản đầu vào
      if (!text || typeof text !== 'string') {
        throw new Error('Văn bản đầu vào không hợp lệ');
      }

      // Kiểm tra apiUrl
      const baseUrl = this.ensureApiUrl(apiUrl);

      // Gửi yêu cầu
      const response = await this.fetchWithTimeout(`${baseUrl}tts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      // Kiểm tra lỗi từ server
      if (!response.ok) {
        throw new Error(data.error || `Lỗi server: ${response.status}`);
      }
      if (data.error) {
        throw new Error(data.error);
      }

      // Kiểm tra dữ liệu trả về
      if (!data.url || typeof data.url !== 'string') {
        throw new Error('URL âm thanh không hợp lệ');
      }

      return data.url;
    } catch (error) {
      const errorMessage = error.message || 'Không thể tạo âm thanh';
      console.error('Error in textToSpeech:', errorMessage);
      throw new Error(errorMessage);
    }
  }
};

export {api};