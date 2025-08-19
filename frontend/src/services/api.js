import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Intercept request to add JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    // Check if token is expired before making request
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      console.log('Token check - exp:', payload.exp, 'current:', currentTime, 'valid:', payload.exp > currentTime, 'timeUntilExpiry:', timeUntilExpiry);
      
      // If token expires in less than 1 hour, show a gentle reminder
      if (timeUntilExpiry < 3600 && timeUntilExpiry > 0) {
        console.log('Token will expire soon, showing reminder');
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(to right, #f59e0b, #d97706);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
          max-width: 300px;
          animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>Session will expire soon. Please save your work.</span>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 5000);
      }
      
      if (payload.exp < currentTime) {
        console.log('Token expired, clearing and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          // Don't show alert here, let the response interceptor handle it
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Token expired'));
      }
    } catch (error) {
      console.log('Invalid token format, clearing and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        // Don't show alert here, let the response interceptor handle it
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Invalid token'));
    }
    
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
      console.log('Authentication error detected, clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show a more user-friendly message before redirecting
      if (window.location.pathname !== '/login') {
        // Use a more subtle notification instead of alert
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(to right, #ef4444, #dc2626);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
          max-width: 300px;
          animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>Session expired. Redirecting to login...</span>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
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
