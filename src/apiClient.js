import axios from 'axios';

console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
const API_URL = import.meta.env.VITE_API_URL || '/';
console.log('Final API_URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Force redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email, password) => {
    // Use URLSearchParams for application/x-www-form-urlencoded
    // This is the standard for OAuth2 password flow and works best with FastAPI's OAuth2PasswordRequestForm
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    
    const response = await api.post('/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
  getUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  // User management
  getAllUsers: async () => (await api.get('/users')).data,
  createUser: async (user) => (await api.post('/users', user)).data,
  updateUser: async (id, user) => (await api.put(`/users/${id}`, user)).data,
  deleteUser: async (id) => (await api.delete(`/users/${id}`)).data,
};

export const backup = {
  downloadDb: async () => {
    const response = await api.get('/backup/db', {
      responseType: 'blob'
    });
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'homecook.db';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch.length === 2)
        fileName = fileNameMatch[1];
    }
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};


export const inventory = {
  getAll: async () => (await api.get('/inventory')).data,
  add: async (item) => (await api.post('/inventory', item)).data,
  update: async (id, item) => (await api.put(`/inventory/${id}`, item)).data,
  remove: async (id) => (await api.delete(`/inventory/${id}`)).data,
  generateImage: async (id) => (await api.post(`/inventory/${id}/generate_image`)).data,
};

export const recipes = {
  getAll: async () => (await api.get('/recipes')).data,
  add: async (item) => (await api.post('/recipes', item)).data,
  update: async (id, item) => (await api.put(`/recipes/${id}`, item)).data,
  remove: async (id) => (await api.delete(`/recipes/${id}`)).data,
};

export const settings = {
  get: async () => (await api.get('/settings')).data,
  update: async (id, item) => (await api.put(`/settings/${id}`, item)).data,
};

export const cookingLogs = {
  getAll: async () => (await api.get('/cooking_logs')).data,
  add: async (log) => (await api.post('/cooking_logs', log)).data,
};

export default api;
