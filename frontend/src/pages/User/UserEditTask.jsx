import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ShimmerForm from "../../components/ShimmerForm";
import { BACKEND_URL } from "../../utils";

const UserEditTask = () => {
  const [taskData, setTaskData] = useState(null);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");
  const [parsedDate, setParsedDate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/v1/user/bulktask/${id}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => setTaskData(response.data))
      .catch(() => {
        setErrorMessage("Error fetching task data.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (dueDate) {
      setParsedDate(dueDate.slice(0, 10));
    }
  }, [dueDate]);

  useEffect(() => {
    if (taskData) {
      setDescription(taskData.description || "");
      setDueDate(taskData.dueDate || "");
      setStatus(taskData.status || "Not Started");
      setComments(taskData.comments || "");
    }
  }, [taskData]);

  const handleSubmit = async () => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    axios
      .put(
        `${BACKEND_URL}/api/v1/user/taskupdate`,
        {
          taskId: parseInt(id),
          id: taskData.user.id,
          status,
          comments,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      )
      .then(() => {
        setSuccessMessage("Task updated successfully!");
      })
      .catch(() => {
        setErrorMessage("Error updating task.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "auto",
        padding: 3,
        backgroundColor: "#fff",
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      {taskData ? (
        <>
          <div className="text-2xl font-bold text-center mb-4">
            {taskData.user ? taskData.user.name : "Loading..."}
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

          <TextField
            label="Description"
            value={description}
            disabled
            fullWidth
            margin="normal"
            variant="outlined"
          />

          <TextField
            label="Due Date"
            value={parsedDate}
            disabled
            fullWidth
            margin="normal"
            variant="outlined"
            type="date"
          />

          <TextField
            label="Comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            multiline
            rows={1}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
            sx={{ marginTop: 3 }}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? "Updating..." : "Update Task"}
          </Button>
        </>
      ) : (
        <ShimmerForm />
      )}
    </Box>
  );
};

export default UserEditTask;
