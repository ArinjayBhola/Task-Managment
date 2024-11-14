/* eslint-disable react/prop-types */
import { Link, useNavigate } from "react-router-dom";
import TaskDetails from "./TaskDetails";

const UserTaskCard = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="border border-gray-300 shadow-lg p-6 rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-gray-800">
          <Link to={`/user/${user.id}`}>Name: {user.name}</Link>
        </div>
        {window.location.pathname === "/users" && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => navigate(`/task/${user.id}`)}
          >
            Create a Task
          </button>
        )}
      </div>
      {user.task.map((task) => (
        <div
          key={task.id}
          className="border border-gray-300 p-4 mt-4 rounded-md bg-gray-50"
        >
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
