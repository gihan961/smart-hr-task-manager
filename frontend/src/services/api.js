import axios from 'axios';

// In production (Netlify), VITE_API_URL points to the Render.com backend.
// In development, falls back to '/api' which is proxied by Vite to localhost:5000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach JWT Authorization header when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_hr_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
