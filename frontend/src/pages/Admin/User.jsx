import AddIcon from "@mui/icons-material/Add";
import { Fab, Tooltip } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CreateUserCard from "../../components/CreateUserCard";
import HomeShimmer from "../../components/HomeShimmer";
import UserTaskCard from "../../components/UserTaskCard";
import { toggleCreateUser } from "../../redux/slice/createUserSlice";
import { BACKEND_URL } from "../../utils";

const User = () => {
  const [data, setData] = useState([]);
  const selector = useSelector((state) => state.createUser);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/admin/bulk`, {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });
    setData(response.data);
  };

  const reversedData = [...data].reverse();

  return (
    <div className="w-full relative">
      {selector && <CreateUserCard />}

      <div className="grid grid-cols-1 gap-6 mt-6 w-8/12 mx-auto">
        {data.length > 0 ? (
          reversedData.map((user) => (
            <div key={user.id}>
              <UserTaskCard user={user} />
            </div>
          ))
        ) : (
          <div className="space-y-6">
            {[1, 2, 3].map((_, index) => (
              <HomeShimmer key={index} />
            ))}
          </div>
        )}
      </div>

      <Tooltip title="Create User" arrow>
        <Fab
          color="primary"
          aria-label="create"
          onClick={() => dispatch(toggleCreateUser())}
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </div>
  );
};

export default User;
