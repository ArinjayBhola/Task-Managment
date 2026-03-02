import api from "../../utils/axiosInstance";
import { useEffect, useState } from "react";
import HomeShimmer from "../../components/HomeShimmer";
import UserTaskCard from "../../components/UserTaskCard";
import { BACKEND_URL } from "../../utils";
import { motion } from "framer-motion";

const AllUser = () => {
  const [userTask, setUserTask] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/user/bulktask`)
      .then((response) => {
        setUserTask(response.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const reverseArray = [...userTask].reverse();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-4">
        <HomeShimmer />
        <HomeShimmer />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-white mb-8">All Users Task Status</h1>
      <div className="space-y-6">
        {reverseArray.length > 0 ? (
          reverseArray.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}>
              <UserTaskCard user={user} />
            </motion.div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-12">No users found.</div>
        )}
      </div>
    </div>
  );
};
export default AllUser;
