import axios from "axios";

// Create axios instance with base URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized access
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

// **Auth Service**
export const authService = {
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },
  register: (data: any) => api.post("/auth/register", data),
  refreshToken: () => api.post("/auth/refresh-token"),
};

// **VM Service**
export const vmService = {
  getInstances: () => api.get("/admin/instances"), // Admin: Get all VM instances
  getInstanceById: (instance_id: string) =>
    api.get(`/admin/instances/${instance_id}`), // Admin: Get VM details
  requestAccess: (vmId: string) => api.post(`/developer/vms/${vmId}/access`), // Developer: Request VM access
};

// **Log Service (SOC)**
export const logService = {
  getLogs: (params?: any) => api.get("/soc/logs", { params }), // SOC: Get logs
  getLogById: (id: string) => api.get(`/soc/logs/${id}`), // SOC: Get log details
  getAlerts: () => api.get("/soc/logs/alerts"), // SOC: Get security alerts
};

// **User Service**
export const userService = {
  getUsers: () => api.get("/admin/users"), // Admin: Get all users
  getProfile: () => api.get("/users/profile"), // Get logged-in user's profile
  updateProfile: (data: any) => api.put("/users/profile", data), // Update profile
};

// **RBAC Service**
export const rbacService = {
  getRoles: () => api.get("/roles"), // Get available roles
  assignRole: (userId: string, role: string) =>
    api.post(`/admin/users/${userId}/role`, { role }), // Assign role
};

// **MFA Service**
export const mfaService = {
  setupMfa: () => api.post("/users/setup-mfa"), // Setup MFA
  verifyMfa: (token: string) => api.post("/users/verify-mfa", { token }), // Verify MFA
};
