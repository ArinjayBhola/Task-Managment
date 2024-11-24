/* eslint-disable react/prop-types */
import { Button } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TaskDetails from "./TaskDetails";

const UserTaskCard = ({ user }) => {
  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    setTimeout(() => {
      const token = localStorage.getItem("token");
      if (token) {
        const decode = jwtDecode(token);
        setUserRole(decode.role);
      }
    }, 1000);
  }, []);

  const toUpperCase = (str) => {
    return str.toUpperCase();
  };

  return (
    <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="text-xl font-semibold text-gray-800">
          {userRole === "Admin" ? (
            <Link to={`/user/${user.id}`}>Name: {toUpperCase(user.name)}</Link>
          ) : (
            <>Name: {toUpperCase(user.name)}</>
          )}
        </div>
        {window.location.pathname === "/users" && (
          <Button
            component={Link}
            to={`/task/${user.id}`}
            variant="contained"
            size="medium"
            color="primary"
          >
            Create new task
          </Button>
        )}
      </div>
      {user.task.map((task) => (
        <div key={task.id}>
          {window.location.pathname === "/users" ? (
            <Link to={`/admin-edittask/${task.id}`}>
              <TaskDetails task={task} />
            </Link>
          ) : (
            <TaskDetails task={task} />
          )}
        </div>
      ))}
    </div>
  );
};

export default UserTaskCard;
