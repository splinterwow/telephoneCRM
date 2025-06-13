// src/lib/axiosInstance.ts
import axios from 'axios';

// API ning asosiy URL manzili. .env faylidan olish yaxshiroq.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://smartphone777.pythonanywhere.com';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // timeout: 10000, // Ixtiyoriy
});

// So'rov interceptori (har bir so'rovga avtomatik token qo'shish uchun)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Siz token saqlaydigan joy
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Javob interceptori (masalan, 401 xatolikni ushlash uchun)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("401 Unauthorized - Token yaroqsiz yoki yo'q.");
      // Bu yerda foydalanuvchini login sahifasiga yo'naltirish yoki
      // refresh token logikasini ishga tushirish mumkin.
      // Masalan:
      // localStorage.removeItem('accessToken');
      // window.location.href = '/login'; 
      // alert("Sessiya muddati tugagan. Iltimos, qayta kiring.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;