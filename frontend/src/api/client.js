import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

let lastUnauthorizedDispatch = 0;
const UNAUTHORIZED_THROTTLE_MS = 1000;

client.interceptors.request.use(
  (config) => {
    // Never attach token to auth login endpoints to prevent interference
    const isLoginEndpoint = config.url && config.url.includes('/auth/login');
    if (!isLoginEndpoint) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Do not trigger global unauthorized event if the failed request was the login request itself
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Throttle dispatch to ensure a batch of 401s only triggers the login flow once
        const now = Date.now();
        if (now - lastUnauthorizedDispatch > UNAUTHORIZED_THROTTLE_MS) {
          lastUnauthorizedDispatch = now;
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
