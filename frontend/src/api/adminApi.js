import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api/admin',
});

// before each request, pull the JWT out of localStorage
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token_admin');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminApi;