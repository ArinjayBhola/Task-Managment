import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CreateUserCard from "../../components/CreateUserCard";
import Header from "../../components/Header";
import HomeShimmer from "../../components/HomeShimmer";
import UserTaskCard from "../../components/UserTaskCard";
import { toggleCreateUser } from "../../redux/slice/createUserSlice";
import { BACKEND_URL } from "../../utils";

const User = () => {
  const [data, setData] = useState([]);
  const selector = useSelector((state) => state.createUser);
  useEffect(() => {
    fetchData();
  }, []);
  const dispatch = useDispatch();

  const fetchData = async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/admin/bulk`, {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });
    setData(response.data);
  };

  if (data.length > 0) {
    return (
      <div>
        <Header />
        <div className="p-4">
          <div className="mb-4">
            <button
              onClick={() => dispatch(toggleCreateUser())}
              className="bg-blue-500 hover:bg-blue-600 shadow-md text-white px-4 py-2 rounded mr-2"
            >
              Create a user
            </button>
          </div>

          {selector && <CreateUserCard />}

          <div className="grid grid-cols-1 gap-6 mt-6">
            {data.map((user) => (
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

export default User;
