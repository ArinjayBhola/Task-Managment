import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ShimmerForm from "../../components/ShimmerForm";
import { BACKEND_URL } from "../../utils";

const AdminEditTask = () => {
  const [userTaskData, setUserTaskData] = useState({});
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");
  const [parsedDate, setParsedDate] = useState("");
  const [taskId, setTaskId] = useState(undefined);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (dueDate) {
      setParsedDate(dueDate.slice(0, 10));
    }
  }, [dueDate]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/v1/admin/task/${id}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => setUserTaskData(response.data))
      .catch((error) => {
        setErrorMessage("Error fetching task data.");
        console.error("Error fetching task data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    setDescription(userTaskData.description || "");
    setDueDate(userTaskData.dueDate || "");
    setStatus(userTaskData.status || "Not Started");
    setComments(userTaskData.comments || "");
    setTaskId(userTaskData.id || "");
  }, [userTaskData]);

  const deleteTask = async () => {
    setLoading(true);
    axios
      .delete(`${BACKEND_URL}/api/v1/admin/delete`, {
        data: {
          taskId,
        },
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then(() => {
        setSuccessMessage("Task deleted successfully!");
        setErrorMessage("");
      })
      .catch(() => {
        setErrorMessage("Error deleting task.");
        setSuccessMessage("");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = async () => {
    setLoading(true);
    axios
      .put(
        `${BACKEND_URL}/api/v1/admin/admincomment`,
        {
          taskId: parseInt(id),
          usersId: userTaskData.userId,
          comment: comments,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      )
      .then(() => {
        setSuccessMessage("Task updated successfully!");
        setErrorMessage("");
      })
      .catch(() => {
        setErrorMessage("Error updating task.");
        setSuccessMessage("");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const nameCapital = (name) => {
    return name.toUpperCase() || "Loading...";
  };

  return (
    <Box mx="auto" mt={5} maxWidth="sm" p={3} boxShadow={3} borderRadius={2}>
      {userTaskData ? (
        <>
          <div className="mb-2 font-bold text-3xl text-center">
            {userTaskData.user
              ? nameCapital(userTaskData.user.name)
              : "Loading..."}
          </div>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2}>
            <div className="mb-2 font-semibold text-lg">
              Email:
              {userTaskData.user ? userTaskData.user.email : "Loading..."}
            </div>

            <TextField
              label="Description"
              value={description}
              fullWidth
              disabled
            />

            <TextField
              label="Due Date"
              type="date"
              value={parsedDate}
              disabled
              fullWidth
            />

            <TextField
              label="Comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              multiline
              rows={1}
            />

            <Select
              value={status}
              fullWidth
              disabled
              displayEmpty
              inputProps={{ readOnly: true }}
            >
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? "Updating..." : "Update Task"}
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={deleteTask}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Task"}
            </Button>
          </Box>
        </>
      ) : (
        <Box>
          <ShimmerForm />
        </Box>
      )}
    </Box>
  );
};

export default AdminEditTask;
