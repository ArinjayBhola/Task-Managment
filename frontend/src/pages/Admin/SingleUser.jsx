import axios from "axios";
import { jwtDecode } from "jwt-decode";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import HomeShimmer from "../../components/HomeShimmer";
import TaskDetails from "../../components/TaskDetails";
import { BACKEND_URL } from "../../utils";

const SingleUser = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      setRole(decodedToken.role);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/admin/user/${userId}`)
      .then((response) => {
        setUserData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [userId]);

  const handleCreateTask = () => {
    if (userData) {
      navigate(`/task/${userData.id}`);
    }
  };

  if (userData) {
    return (
      <div>
        <Header />
        <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-white">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold text-gray-800">
              Name: {userData.name}
            </div>
            {role !== "User" && (
              <button
                onClick={handleCreateTask}
                className="py-2 px-4 brder border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create new task
              </button>
            )}
          </div>
          <div>
            {userData.task.map((task) => (
              <TaskDetails key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="space-y-6">
        {[1, 2, 3].map((_, index) => (
          <HomeShimmer key={index} />
        ))}
      </div>
    </div>
  );
};

export default SingleUser;
