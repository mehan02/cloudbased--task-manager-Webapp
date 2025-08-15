import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Intercept request to add JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server might be down');
    }
    // If we get a 401 or 403 error, clear the invalid token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      // Redirect to login page if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper functions for common API calls
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/signup", userData),
  register: (userData) => api.post("/auth/register", userData)
};

export const tasksAPI = {
  getAll: () => api.get("/tasks"),
  getToday: () => api.get("/tasks/today"),
  getUpcoming: () => api.get("/tasks/upcoming"),
  getByList: (listId) => api.get(`/tasks/list/${listId}`),
  create: (task) => api.post("/tasks", task),
  update: (id, task) => api.put(`/tasks/${id}`, task),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (taskOrders) => api.put("/tasks/reorder", taskOrders),
};

export const listsAPI = {
  getAll: () => api.get("/lists"),
  getTasks: (listId) => api.get(`/lists/${listId}/tasks`),
  create: (list) => api.post("/lists", list),
  update: (id, list) => api.put(`/lists/${id}`, list),
  delete: (id) => api.delete(`/lists/${id}`)
};

export default api;
