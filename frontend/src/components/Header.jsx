import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const Header = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    setTimeout(() => {
      const token = localStorage.getItem("token");
      const decode = jwtDecode(token);
      setUserRole(decode.role);
    }, 1000);
  }, []);
  const handleLogout = () => {
    if (userRole === "User") {
      navigate("/user-signin");
    } else if (userRole === "Admin") {
      navigate("/admin-signin");
    }
    localStorage.removeItem("token");
  };
  return (
    <header className="bg-customColor text-white p-5 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={userRole === "User" ? "/usertasks" : "/users"}>
          <h1 className="text-2xl font-bold tracking-wide">
            Task Management System
          </h1>
        </Link>
        <div className="space-x-4">
          {userRole === "User" && (
            <button
              onClick={() => navigate("/mytasks")}
              className="bg-white text-blue-600 font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-gray-200 transition duration-300"
            >
              My Task
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
