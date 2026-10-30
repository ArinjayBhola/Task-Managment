/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { AuthContext } from "../hooks/useAuth";
import api from "../utils/axiosInstance";
import { notify } from "../utils/notifications";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeOrgId");
    api
      .get("/auth/session")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expire = () => {
      setUser(null);
      notify("Your session expired. Please sign in again.", "warning");
    };
    window.addEventListener("auth-expired", expire);
    return () => window.removeEventListener("auth-expired", expire);
  }, []);
  async function logout() {
    try {
      await api.post("/auth/logout");
      setUser(null);
      notify("You have been signed out.");
      return true;
    } catch {
      notify("Could not sign out. Please try again.", "error");
      return false;
    }
  }
  if (loading)
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
      >
        Checking your session…
      </div>
    );
  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
