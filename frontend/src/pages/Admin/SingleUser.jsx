import { Button } from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const toUpperCase = (str) => {
    return str.toUpperCase();
  };

  if (userData) {
    return (
      <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-gray-50 w-8/12 mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold text-gray-800">
            Name: {toUpperCase(userData.name)}
          </div>
          {role === "Admin" && (
            <Button
              onClick={handleCreateTask}
              variant="contained"
              color="primary"
              sx={{
                variant: "contained",
                size: "medium",
                color: "primary",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }}
            >
              Create new task
            </Button>
          )}
        </div>
        <div>
          {userData.task.map((task) => (
            <TaskDetails key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {[1, 2, 3].map((_, index) => (
        <HomeShimmer key={index} />
      ))}
    </div>
  );
};

export default SingleUser;
