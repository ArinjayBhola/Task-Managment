import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Eye from "../../components/Eye";
import HideEye from "../../components/HideEye";
import { BACKEND_URL } from "../../utils";

const AdminSignin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [clicked, setIsClicked] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) navigate("/users");
  }, [token, navigate]);

  const signin = async () => {
    try {
      setIsClicked(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/admin/signin`,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        navigate("/users");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      setError(errorMessage);
    } finally {
      setIsClicked(false);
    }
  };

  return (
    <div
      className="relative h-screen bg-cover bg-center"
      style={{ backgroundImage: 'url("/signin.jpg")' }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Sign in to your Admin account
          </h2>
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 w-full p-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <div className="relative mb-6">
            <input
              type={isSelected ? "text" : "password"}
              placeholder="Password"
              className="border border-gray-300 w-full p-3 pr-12 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              onClick={() => setIsSelected(!isSelected)}
            >
              {isSelected ? <Eye /> : <HideEye />}
            </div>
          </div>
          <button
            onClick={signin}
            className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors duration-300"
            disabled={clicked}
          >
            {clicked ? "Signing In..." : "Sign In"}
          </button>

          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          <div className="text-center mt-4 text-gray-600">
            Don&apos;t have an account?{" "}
            <Link to="/admin-signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignin;
