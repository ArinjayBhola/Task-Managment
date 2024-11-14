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
      } else if (decode.role === "User") {
        navigate("/usertasks");
      }
    }
  }, [token, navigate]);

  return (
    <div className="relative h-screen w-full">
      <img
        src="/task.png"
        alt=""
        className="absolute h-full w-full object-cover"
      />
      <div className="relative z-10 min-h-screen flex items-center justify-center w-full bg-black bg-opacity-50">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-8">
            Welcome to Task Management App
          </h1>
          <div className="space-x-4">
            <Link
              to="/admin-signin"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Login as Admin
            </Link>
            <Link
              to="/user-signin"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Login as User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
