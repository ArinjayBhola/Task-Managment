import axios from "axios";
import { useEffect, useState } from "react";
import HomeShimmer from "../../components/HomeShimmer";
import TaskDetails from "../../components/TaskDetails";
import { BACKEND_URL } from "../../utils";
import { Card } from "../../components/ui/Card";
import { CheckCircle2, Circle, Clock, ListTodo } from "lucide-react";
import { motion } from "framer-motion";

const MyTask = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/user/bulk`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => {
        setUserData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching tasks!", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let notStartedTasks = 0;

  userData.forEach((user) => {
    // If not, default to empty array
    const userTasks = user.tasks || [];
    totalTasks += userTasks.length;
    userTasks.forEach((task) => {
      if (task.status === "Completed") completedTasks++;
      else if (task.status === "In Progress") inProgressTasks++;
      else if (task.status === "Not Started") notStartedTasks++;
    });
  });

  const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}>
      <Card className="flex items-center gap-4 p-6 border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
        <div className={`p-3 rounded-xl bg-white/5 ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <HomeShimmer />
        <HomeShimmer />
      </div>
    );
  }

  if (userData.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">No data found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-6">Task Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={totalTasks}
            icon={ListTodo}
            colorClass="text-blue-400 bg-blue-400/10"
            delay={0}
          />
          <StatCard
            title="Completed"
            value={completedTasks}
            icon={CheckCircle2}
            colorClass="text-green-400 bg-green-400/10"
            delay={0.1}
          />
          <StatCard
            title="In Progress"
            value={inProgressTasks}
            icon={Clock}
            colorClass="text-yellow-400 bg-yellow-400/10"
            delay={0.2}
          />
          <StatCard
            title="Not Started"
            value={notStartedTasks}
            icon={Circle}
            colorClass="text-red-400 bg-red-400/10"
            delay={0.3}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Your Tasks</h2>
          {userData.map((user) => (
            <div
              key={user.id}
              className="space-y-4">
              {user.tasks?.length === 0 ? (
                <p className="text-muted-foreground italic">You have no assigned tasks.</p>
              ) : (
                user.tasks?.map((task) => (
                  <TaskDetails
                    key={task.id}
                    task={task}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MyTask;
