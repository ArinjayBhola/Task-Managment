import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

import CreateUserCard from "../../components/CreateUserCard";
import HomeShimmer from "../../components/HomeShimmer";
import UserTaskCard from "../../components/UserTaskCard";
import { toggleCreateUser } from "../../redux/slice/createUserSlice";
import { BACKEND_URL } from "../../utils";
import { Button } from "../../components/ui/Button";

const User = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const selector = useSelector((state) => state.createUser);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/admin/bulk`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      setData(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reversedData = [...data].reverse();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative min-h-screen">
      {selector && <CreateUserCard />}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <Button
          onClick={() => dispatch(toggleCreateUser())}
          className="md:hidden rounded-full w-12 h-12 p-0 flex items-center justify-center fixed bottom-6 right-6 z-40 shadow-2xl">
          <Plus />
        </Button>
        <Button
          onClick={() => dispatch(toggleCreateUser())}
          className="hidden md:flex gap-2">
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <HomeShimmer />
          <HomeShimmer />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-20">
          {data.length > 0 ? (
            reversedData.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}>
                <UserTaskCard user={user} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No users found. Create one to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default User;
