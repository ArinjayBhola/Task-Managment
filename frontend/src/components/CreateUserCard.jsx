import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toggleCreateUser } from "../redux/slice/createUserSlice";
import { BACKEND_URL } from "../utils";

const CreateUserCard = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();

  const postUser = async () => {
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
    console.log(response);
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
      <div className="relative w-full max-w-md p-6 bg-white shadow-lg rounded-md transition-transform transform scale-100">
        <button
          className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded"
          onClick={() => dispatch(toggleCreateUser())}
        >
          Close
        </button>
        <h2 className="text-xl mb-4">Create User</h2>
        <div className="mb-4">
          <input
            className="w-full px-3 py-2 border rounded"
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <input
            className="w-full px-3 py-2 border rounded"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <input
            className="w-full px-3 py-2 border rounded"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={postUser}
        >
          Create User
        </button>
      </div>
    </div>
  );
};

export default CreateUserCard;
