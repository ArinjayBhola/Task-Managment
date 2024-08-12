import { Link } from "react-router-dom";

const Appbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/tasks" className="text-white text-lg font-bold">
          Task Management
        </Link>
        <div className="flex space-x-4">
          <Link
            to="/admin"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            Admin
          </Link>
          <Link
            to="/user"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            User
          </Link>
          <Link
            to="/admin-signin"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            onClick={() => localStorage.removeItem("token")}
          >
            Logout
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Appbar;
