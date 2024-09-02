import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (token) {
      const decode = jwtDecode(token);
      if (decode.role === "Admin") {
        navigate("/users");
      }
      if (decode.role === "User") {
        navigate("/usertasks");
      }
    }
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to Task Management App
        </h1>
        <div className="space-x-4">
          <Link
            to="/admin-signin"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Login as Admin
          </Link>
          <Link
            to="/user-signin"
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Login as User
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
