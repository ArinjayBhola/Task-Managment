import axios from "axios";
import { BACKEND_URL } from "./index";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const orgId = localStorage.getItem("activeOrgId");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (orgId) {
      config.headers["x-organization-id"] = orgId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
