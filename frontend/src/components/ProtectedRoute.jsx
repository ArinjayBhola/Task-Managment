/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import useAuthenticate from "../utils/useAuthenticate";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, role }) => {
  const isAuthenticated = useAuthenticate();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  const account = jwtDecode(localStorage.getItem("token"));
  if (role && account.role !== role)
    return (
      <Navigate to={account.role === "Admin" ? "/users" : "/mytasks"} replace />
    );

  return children;
};

export default ProtectedRoute;
