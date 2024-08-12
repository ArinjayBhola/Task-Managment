import axios from "axios";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import HomeShimmer from "../../components/HomeShimmer";
import UserTaskCard from "../../components/UserTaskCard";
import { BACKEND_URL } from "../../utils";

const AllUser = () => {
  const [userTask, setUserTask] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/user/bulktask`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => {
        setUserTask(response.data);
        console.log(response);
      });
  }, []);

  if (userTask.length > 0) {
    return (
      <div>
        <Header />
        <div className="container mx-auto p-4 mt-6">
          <div className="grid grid-cols-1 gap-6">
            {userTask.map((user) => (
              <div key={user.id}>
                <UserTaskCard user={user} />
              </div>
            ))}
          </div>
        </div>
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
export default AllUser;
