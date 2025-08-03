import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.74:8080/api/v1', // ⚠️ 너의 IP로 바꾸기!
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

await AsyncStorage.setItem("authToken", response.data.token);
export default api;