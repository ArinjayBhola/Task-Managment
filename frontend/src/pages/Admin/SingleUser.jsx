import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header";
import HomeShimmer from "../../components/HomeShimmer";
import TaskDetails from "../../components/TaskDetails";
import { BACKEND_URL } from "../../utils";

const SingleUser = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);

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

  if (userData) {
    return (
      <div>
        <Header />
        <>
          <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-white">
            <div className="text-lg font-semibold text-gray-800">
              Name: {userData.name}
            </div>
            <div>
              {userData.task.map((task) => (
                <TaskDetails key={task.id} task={task} />
              ))}
            </div>
          </div>
        </>
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
