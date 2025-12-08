import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../utils";
import HomeShimmer from "../../components/HomeShimmer";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const AdminEditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userTaskData, setUserTaskData] = useState(null);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/v1/admin/task/${id}`, {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then((response) => {
        setUserTaskData(response.data);
        setDescription(response.data.description || "");
        setDueDate(response.data.dueDate ? response.data.dueDate.slice(0, 10) : "");
        setStatus(response.data.status || "Not Started");
        setComments(response.data.comments || "");
      })
      .catch((error) => console.error("Error fetching task:", error))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${BACKEND_URL}/api/v1/admin/admincomment`,
        {
          taskId: parseInt(id),
          usersId: userTaskData.userId,
          comment: comments,
        },
        { headers: { Authorization: localStorage.getItem("token") } },
      );
      setSuccessMessage("Task updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Error updating task.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/v1/admin/delete`, {
        data: { taskId: userTaskData.id },
        headers: { Authorization: localStorage.getItem("token") },
      });
      navigate(-1);
    } catch (error) {
      setErrorMessage("Error deleting task.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userTaskData)
    return (
      <div className="container mx-auto p-4">
        <HomeShimmer />
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-10 flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg">
        <Card className="border-white/10 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4 text-muted-foreground"
            onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="text-center mb-8 mt-6">
            <h1 className="text-2xl font-bold text-white">Edit Task</h1>
            <p className="text-muted-foreground mt-2">
              User: <span className="text-primary font-medium">{userTaskData?.user?.name}</span>
            </p>
          </div>

          <div className="space-y-4">
            {successMessage && (
              <div className="p-3 bg-green-500/10 text-green-400 rounded-lg text-sm border border-green-500/20">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
                {errorMessage}
              </div>
            )}

            <Input
              label="Description"
              value={description}
              disabled
              className="opacity-70"
            />

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              disabled
              className="opacity-70"
            />

            <Select
              label="Status"
              value={status}
              disabled
              className="opacity-70"
              options={[
                { value: "Not Started", label: "Not Started" },
                { value: "In Progress", label: "In Progress" },
                { value: "Completed", label: "Completed" },
              ]}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Admin Comments</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-white/5 px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button
                variant="danger"
                onClick={deleteTask}
                disabled={loading}
                className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminEditTask;
