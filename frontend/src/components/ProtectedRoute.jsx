/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import useAuthenticate from "../utils/useAuthenticate";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthenticate();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
