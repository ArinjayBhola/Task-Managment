import { Button } from "../../components/ui/Button";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HomeShimmer from "../../components/HomeShimmer";
import TaskDetails from "../../components/TaskDetails";
import { BACKEND_URL } from "../../utils";
import { Card } from "../../components/ui/Card";
import { Plus } from "lucide-react";

const SingleUser = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setRole(decodedToken.role);
      } catch (e) {
        console.error(e);
      }
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

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <HomeShimmer />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-white/10 bg-card/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{userData.name}</h1>
            <p className="text-muted-foreground">Managing {userData.tasks?.length || 0} tasks</p>
          </div>

          {role === "Admin" && (
            <Button
              onClick={handleCreateTask}
              className="gap-2">
              <Plus className="w-4 h-4" />
              Create new task
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {userData.tasks?.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No tasks assigned to this user.</p>
          ) : (
            userData.tasks?.map((task) => (
              <TaskDetails
                key={task.id}
                task={task}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SingleUser;
