/* eslint-disable react/prop-types */
import { Badge, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TaskDetails = ({ task }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return {
      formatted: `${day}-${month}-${year}`,
      parsedDate: date,
    };
  };

  const calculateDaysLeft = (dueDate) => {
    const currentDate = new Date();
    const timeDifference = dueDate - currentDate;
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  };

  const createdAt = formatDate(task.createdAt);
  const dueDate = formatDate(task.dueDate);
  const daysLeft = calculateDaysLeft(dueDate.parsedDate);

  return (
    <div className="flex flex-col sm:flex-row justify-between p-6 bg-white shadow-lg rounded-lg mb-4 max-w-4xl w-full hover:bg-gray-200 transition duration-1000">
      <div className="flex-1 mb-4 sm:mb-0">
        <p className="text-base text-gray-600 mb-2 font-semibold">
          Created At: {createdAt.formatted}
        </p>
        <p className="text-base text-gray-600 mb-2 font-semibold">
          Description: {task.description}
        </p>
        <p
          className={`text-base mb-2 font-semibold ${
            daysLeft <= 3 ? "text-red-500" : "text-gray-600"
          }`}
        >
          Due Date: {dueDate.formatted}
        </p>
        <p className="text-base text-gray-600 mb-2 font-semibold">
          Status: {task.status}
          {task.status === "Completed" ? (
            <Badge
              color="success"
              overlap="circular"
              variant="dot"
              sx={{ ml: 1 }}
            />
          ) : task.status === "In Progress" ? (
            <Badge
              color="info"
              overlap="circular"
              variant="dot"
              sx={{ ml: 1 }}
            />
          ) : (
            <Badge
              color="error"
              overlap="circular"
              variant="dot"
              sx={{ ml: 1 }}
            />
          )}
        </p>
      </div>

      {window.location.pathname === "/mytasks" && (
        <div className="flex justify-end items-center">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/user-edittask/${task.id}`)}
            sx={{
              paddingX: 3,
              paddingY: 1.5,
              borderRadius: "20px",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
            }}
          >
            Edit Task
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
