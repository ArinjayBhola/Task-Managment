import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../utils";

const AdminSignin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) navigate("/users");
  }, []);

  const signin = async () => {
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
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign in to your account
        </h2>
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 w-full p-2 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 w-full p-2 mb-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <button
          onClick={signin}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
        >
          Sign in
        </button>
        <div className="text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link to={"/admin-signup"} className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSignin;
