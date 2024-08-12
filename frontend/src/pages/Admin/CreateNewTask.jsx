import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header";
import { BACKEND_URL } from "../../utils";

const CreateNewTask = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState({});
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/admin/${id}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => {
        setUserData(response.data);
      });
  }, [id]);

  const handleSubmit = async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/task`,
      {
        description,
        dueDate,
        status,
        id: parseInt(id),
        comments,
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
    <div>
      <Header />
      <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Create Task</h2>
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">
            <p>Name: {userData.name}</p>
            <p>Email: {userData.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description:
            </label>
            <input
              type="text"
              name="description"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date:
            </label>
            <input
              type="date"
              id="dueDate"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comments:
            </label>
            <textarea
              id="comments"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNewTask;
