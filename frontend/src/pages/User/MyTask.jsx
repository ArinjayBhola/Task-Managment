import axios from "axios";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
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
        setUserData(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the tasks!", error);
      });
  }, []);

  if (userData.length > 0) {
    return (
      <div>
        <Header />
        <>
          {userData.length === 0 ? (
            <p>No tasks found.</p>
          ) : (
            <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold text-gray-800">
                  Name: {userData[0].name}
                </div>
              </div>
              <div>
                {userData.map((user) => (
                  <div
                    key={user.id}
                    className="border border-gray-300 p-4 mt-4 rounded-md bg-gray-50"
                  >
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
        <Header />
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
