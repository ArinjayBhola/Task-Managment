/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user)
    return (
      <Navigate
        to={role === "Admin" ? "/admin-signin" : "/user-signin"}
        replace
      />
    );
  if (role && user.role !== role)
    return (
      <Navigate to={user.role === "Admin" ? "/users" : "/mytasks"} replace />
    );
  return children;
}
