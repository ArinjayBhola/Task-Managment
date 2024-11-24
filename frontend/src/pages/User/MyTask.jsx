import axios from "axios";
import { useEffect, useState } from "react";
import HomeShimmer from "../../components/HomeShimmer";
import TaskDetails from "../../components/TaskDetails";
import { BACKEND_URL } from "../../utils";

const MyTask = () => {
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/user/bulk`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => {
        const users = response.data;
        setUserData(users);
      })
      .catch((error) => {
        console.error("There was an error fetching the tasks!", error);
      });
  }, []);

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let notStartedTasks = 0;

  userData.forEach((user) => {
    totalTasks += user.task.length;
    user.task.forEach((task) => {
      if (task.status === "Completed") {
        completedTasks++;
      } else if (task.status === "In Progress") {
        inProgressTasks++;
      } else if (task.status === "Not Started") {
        notStartedTasks++;
      }
    });
  });

  const toUpperCase = (str) => {
    return str.toUpperCase();
  };

  if (userData.length > 0) {
    return (
      <div className="w-8/12 mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Task Statistics</h2>
          <div className="grid grid-cols-2 gap-4 p-4 border border-gray-300 rounded-lg bg-gray-100">
            <p className="font-medium">Total Tasks: {totalTasks}</p>
            <p className="font-medium text-green-600">
              Completed: {completedTasks}
            </p>
            <p className="font-medium text-yellow-600">
              In Progress: {inProgressTasks}
            </p>
            <p className="font-medium text-red-600">
              Not Started: {notStartedTasks}
            </p>
          </div>
        </div>
        <>
          {userData.length === 0 ? (
            <p>No tasks found.</p>
          ) : (
            <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div className="text-xl font-semibold text-gray-800">
                  Name: {toUpperCase(userData[0].name)}
                </div>
              </div>
              <div>
                {userData.map((user) => (
                  <div key={user.id}>
                    {user.task.map((task) => (
                      <div key={task.id}>
                        <TaskDetails task={task} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      </div>
    );
  } else {
    return (
      <div>
        <div className="space-y-6">
          {[1, 2, 3].map((_, index) => (
            <HomeShimmer key={index} />
          ))}
        </div>
      </div>
    );
  }
};

export default MyTask;
