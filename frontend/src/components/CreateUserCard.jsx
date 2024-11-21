import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleCreateUser } from "../redux/slice/createUserSlice";
import { BACKEND_URL } from "../utils";
import Eye from "./Eye";
import HideEye from "./HideEye";

const CreateUserCard = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [postError, setPostError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const postUser = async () => {
    setLoading(true);
    setPostError(false);
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/admin/usersignup`,
        {
          name,
          email,
          password,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      );
      if (response.status === 200) {
        setSuccessMessage("User created successfully!");
        navigate(`/user/${response.data.id}`);
      }
    } catch (error) {
      setPostError(true);
      setErrorMessage(error.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
      <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg p-6 bg-white shadow-lg rounded-md transition-transform transform scale-100">
        <button
          className="absolute top-2 right-2 text-2xl text-gray-600 font-bold hover:text-gray-800"
          onClick={() => dispatch(toggleCreateUser())}
        >
          &times;
        </button>

        <h2 className="text-xl mb-4 text-center sm:text-left">Create User</h2>

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4">
            {successMessage}
          </div>
        )}

        {postError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <div className="mb-4">
          <input
            className="w-full px-3 py-2 border rounded focus:outline-none"
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <input
            className="w-full px-3 py-2 border rounded focus:outline-none"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
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
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={postUser}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
};

export default CreateUserCard;
