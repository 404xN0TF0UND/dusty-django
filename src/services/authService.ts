import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth/';

export const AuthService = {
  login: async (username: string, password: string) => {
    const response = await axios.post(API_URL + 'token/', { username, password });
    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    delete axios.defaults.headers.common['Authorization'];
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) throw new Error('No refresh token');
    const response = await axios.post(API_URL + 'token/refresh/', { refresh });
    if (response.data.access) {
      localStorage.setItem('access', response.data.access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    }
    return response.data;
  },

  getAccessToken: () => localStorage.getItem('access'),
  getRefreshToken: () => localStorage.getItem('refresh'),
}; 