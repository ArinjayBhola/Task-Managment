import axios from "axios";
import { useEffect, useState } from "react";
import HomeShimmer from "../../components/HomeShimmer";
import UserTaskCard from "../../components/UserTaskCard";
import { BACKEND_URL } from "../../utils";

const AllUser = () => {
  const [userTask, setUserTask] = useState([]);

  const reverseArray = [...userTask].reverse();

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/user/bulktask`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => {
        setUserTask(response.data);
      });
  }, []);

  if (userTask.length > 0) {
    return (
      <div className="w-8/12 mx-auto p-4 mt-6">
        <div className="grid grid-cols-1 gap-6">
          {reverseArray.map((user) => (
            <div key={user.id}>
              <UserTaskCard user={user} />
            </div>
          ))}
        </div>
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
export default AllUser;
