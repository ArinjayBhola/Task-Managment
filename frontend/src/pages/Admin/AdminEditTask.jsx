import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header";
import ShimmerForm from "../../components/ShimmerForm";
import { BACKEND_URL } from "../../utils";

const AdminEditTask = () => {
  const [userTaskData, setUserTaskData] = useState({});
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");
  const [parsedDate, setParsedDate] = useState("");
  const { id } = useParams();

  useEffect(() => {
    if (dueDate) {
      setParsedDate(dueDate.slice(0, 10));
    }
  }, [dueDate]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/admin/task/${id}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => setUserTaskData(response.data))
      .catch((error) => console.error("Error fetching task data:", error));
  }, [id]);

  useEffect(() => {
    setDescription(userTaskData.description || "");
    setDueDate(userTaskData.dueDate || "");
    setStatus(userTaskData.status || "Not Started");
    setComments(userTaskData.comments || "");
  }, [userTaskData]);

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/v1/admin/admincomment`,
        {
          taskId: parseInt(id),
          usersId: userTaskData.userId,
          comment: comments,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      );
      console.log("Response:", response);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  if (userTaskData) {
    return (
      <div>
        <Header />
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {userTaskData.user ? userTaskData.user.name : "Loading..."}
          </h2>
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700">
              <p>
                Email:{" "}
                {userTaskData.user ? userTaskData.user.email : "Loading..."}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description:
              </label>
              <input
                type="text"
                name="description"
                value={description}
                disabled
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date:
              </label>
              <input
                type="date"
                id="dueDate"
                value={parsedDate}
                disabled
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Comments:
              </label>
              <input
                type="text"
                name="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                type="text"
                name="status"
                value={status}
                disabled
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleSubmit}
            >
              Update Task
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <Header />
        <div className="space-y-6">
          {[1].map((_, index) => (
            <ShimmerForm key={index} />
          ))}
        </div>
      </div>
    );
  }
};

export default AdminEditTask;
