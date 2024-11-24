import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleCreateUser } from "../redux/slice/createUserSlice";
import { BACKEND_URL } from "../utils";

import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";

const CreateUserCard = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [postError, setPostError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const postUser = async () => {
    setLoading(true);
    setPostError(false);
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/admin/usersignup`,
        {
          name,
          email,
          password,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      );
      if (response.status === 200) {
        setSuccessMessage("User created successfully!");
        navigate(`/user/${response.data.id}`);
      }
    } catch (error) {
      setPostError(true);
      setErrorMessage(error.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => dispatch(toggleCreateUser())}
      PaperProps={{
        sx: { width: "450px", maxWidth: "90%" },
      }}
    >
      <DialogTitle>
        Create User
        <IconButton
          aria-label="close"
          onClick={() => dispatch(toggleCreateUser())}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {successMessage && (
          <div className="text-center">
            <div className="text-green-400">{successMessage}</div>
          </div>
        )}

        {postError && (
          <div className="text-center">
            <div className="text-red-600">{errorMessage}</div>
          </div>
        )}

        <TextField
          fullWidth
          label="Name"
          variant="outlined"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
        />
        <TextField
          fullWidth
          label="Password"
          type={isPasswordVisible ? "text" : "password"}
          variant="outlined"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  edge="end"
                >
                  {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          fullWidth
          color="primary"
          onClick={postUser}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
          sx={{ mt: 2 }}
        >
          {loading ? "Creating..." : "Create User"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserCard;
