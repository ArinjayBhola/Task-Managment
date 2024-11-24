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
import { BACKEND_URL } from "../../utils";

const CreateNewTask = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState({});
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/admin/${id}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((response) => {
        setUserData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setErrorMessage("Error fetching user data.");
      });
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    await axios
      .post(
        `${BACKEND_URL}/api/v1/admin/task`,
        {
          description,
          dueDate,
          status,
          id: parseInt(id),
          comments,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      )
      .then(() => {
        setSuccessMessage("Task created successfully!");
      })
      .catch((error) => {
        console.error("Error creating task:", error);
        setErrorMessage("Error creating task.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const capitalName = (str) => {
    return str?.toUpperCase();
  };

  return (
    <Box
      maxWidth="sm"
      mx="auto"
      mt={5}
      p={4}
      bgcolor="background.paper"
      boxShadow={3}
      borderRadius={2}
    >
      <div className="font-semibold text-2xl mb-4 text-center">
        Create New Task
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

      <Box mb={3}>
        <div className="font-semibold text-lg">
          Name: {capitalName(userData.name) || "Loading..."}
        </div>
        <div className="font-semibold text-lg">
          Email: {userData.email || "Loading..."}
        </div>
      </Box>

      <Box component="form" display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextField
          label="Due Date"
          type="date"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <TextField
          label="Comments"
          fullWidth
          multiline
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          fullWidth
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
          {loading ? "Creating..." : "Submit"}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateNewTask;
