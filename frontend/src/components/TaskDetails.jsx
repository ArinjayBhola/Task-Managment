/* eslint-disable react/prop-types */
import { useNavigate, useLocation } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";

const TaskDetails = ({ task }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const calculateDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    return differenceInDays(new Date(dueDate), new Date());
  };

  const daysLeft = calculateDaysLeft(task.dueDate);
  const isUrgent = daysLeft <= 3 && task.status !== "Completed";

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  return (
    <Card className="mb-4 transition-all duration-300 hover:bg-white/5 group border-white/5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-white/90 group-hover:text-primary transition-colors">
              {task.description}
            </h3>
            <span className={clsx("px-3 py-1 rounded-full text-xs font-medium border", getStatusColor(task.status))}>
              {task.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDate(task.createdAt)}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5", isUrgent && "text-destructive font-medium")}>
              <Clock className="w-4 h-4" />
              <span>Due: {formatDate(task.dueDate)}</span>
              {isUrgent && <AlertCircle className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {location.pathname === "/mytasks" && (
          <div className="flex items-center sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 sm:pl-4 sm:border-l sm:ml-4">
            <Button
              size="sm"
              onClick={() => navigate(`/user-edittask/${task.id}`)}>
              Edit Task
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskDetails;
