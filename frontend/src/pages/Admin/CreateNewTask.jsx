import api from "../../utils/axiosInstance";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../utils";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const CreateNewTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get(`/admin/${id}`)
      .then((response) => setUserData(response.data))
      .catch((error) => console.error("Error fetching user data:", error));
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await api.post(`/admin/task`, { description, dueDate, status, id: parseInt(id), comments });
      setSuccessMessage("Task created successfully!");
      setTimeout(() => navigate(-1), 1000);
    } catch (error) {
      setErrorMessage("Error creating task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
            <h1 className="text-2xl font-bold text-white">Assign New Task</h1>
            <p className="text-muted-foreground mt-2">
              Assigning to <span className="text-primary font-medium">{userData.name || "..."}</span>
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details..."
            />

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "Not Started", label: "Not Started" },
                { value: "In Progress", label: "In Progress" },
                { value: "Completed", label: "Completed" },
              ]}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Comments</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-white/5 px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSubmit}
              disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Task"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateNewTask;
