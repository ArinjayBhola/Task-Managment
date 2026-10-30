/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TaskDetails from "./TaskDetails";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { UserCircle } from "lucide-react";

const UserTaskCard = ({ user }) => {
  const [userRole, setUserRole] = useState("");
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decode = jwtDecode(token);
        setUserRole(decode.role);
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  return (
    <Card className="mb-6 border-white/10 bg-card/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {userRole === "Admin" ? (
              <Link
                to={`/user/${user.id}`}
                className="hover:text-primary transition-colors">
                {user.name}
              </Link>
            ) : (
              <span>{user.name}</span>
            )}
            <span className="text-sm font-normal text-muted-foreground ml-2">({user.tasks?.length || 0} tasks)</span>
          </div>
        </div>

        {location.pathname === "/users" && (
          <Link to={`/task/${user.id}`}>
            <Button size="sm">Create new task</Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {user.tasks?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic">No tasks assigned yet.</div>
        ) : (
          user.tasks?.map((task) => (
            <div key={task.id}>
              {location.pathname === "/users" ? (
                <Link
                  to={`/admin-edittask/${task.id}`}
                  className="block">
                  <TaskDetails task={task} />
                </Link>
              ) : (
                <TaskDetails task={task} />
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default UserTaskCard;
