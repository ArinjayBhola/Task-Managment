import axios from "axios";
import { BACKEND_URL } from "./index";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      ![
        "/auth/session",
        "/admin/signin",
        "/user/signin",
        "/auth/password",
      ].includes(error.config?.url)
    )
      window.dispatchEvent(new Event("auth-expired"));
    return Promise.reject(error);
  },
);

export default api;
