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
        <div className="text-center text-white p-4 md:p-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8">
            Welcome to Task Management App
          </h1>
          <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
            <Link
              to="/admin-signin"
              className="px-6 py-3 text-sm md:text-base bg-blue-500 hover:bg-blue-600 text-white rounded shadow-lg transition-transform transform hover:scale-105"
            >
              Login as Admin
            </Link>
            <Link
              to="/user-signin"
              className="px-6 py-3 text-sm md:text-base bg-green-500 hover:bg-green-600 text-white rounded shadow-lg transition-transform transform hover:scale-105"
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
