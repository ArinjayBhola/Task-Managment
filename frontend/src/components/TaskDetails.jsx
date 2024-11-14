import { useNavigate } from "react-router-dom";

/* eslint-disable react/prop-types */
const TaskDetails = ({ task }) => {
  const navigate = useNavigate();
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };
  return (
    <div
      className={`border border-gray-300 transition duration-300 shadow-lg p-6 rounded-lg bg-white m-5 flex justify-between ${
        window.location.pathname === "/users" ? "hover:bg-gray-100" : ""
      }`}
    >
      <div>
        <div className="mb-2 text-sm text-gray-600">
          Created At: {formatDate(task.createdAt)}
        </div>
        <div className="mb-2 text-sm text-gray-600">
          Description: {task.description}
        </div>
        <div className="mb-2 text-sm text-gray-600">
          Due Date: {formatDate(task.dueDate)}
        </div>
        <div className="mb-2 text-sm text-gray-600">Status: {task.status}</div>
      </div>
      {window.location.pathname === "/mytasks" && (
        <div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate(`/user-edittask/${task.id}`)}
          >
            Edit Task
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
