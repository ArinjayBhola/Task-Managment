import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../utils";

const AdminSignup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [clicked, setIsClicked] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) navigate("/users");
  }, [token, navigate]);

  const postData = async () => {
    try {
      setIsClicked(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/admin/signup`,
        {
          name,
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data.token) navigate("/users");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      setError(errorMessage);
    } finally {
      setIsClicked(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
        padding: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: "white",
          padding: 4,
          borderRadius: 3,
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div className="font-semibold text-[#4e54c8] mb-5 text-4xl">
          Create Your Admin Account
        </div>

        <div className="mb-3 bg-gray-200 border-b-2 border-gray-200"></div>

        <TextField
          label="Full Name"
          variant="outlined"
          fullWidth
          margin="normal"
          onChange={(e) => setName(e.target.value)}
          value={name}
          InputProps={{
            sx: { borderRadius: 2 },
          }}
        />
        <TextField
          label="Email Address"
          variant="outlined"
          fullWidth
          margin="normal"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          InputProps={{
            sx: { borderRadius: 2 },
          }}
        />
        <Box sx={{ position: "relative", marginBottom: 2 }}>
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type={isSelected ? "text" : "password"}
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <IconButton
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
            onClick={() => setIsSelected(!isSelected)}
          >
            {isSelected ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={postData}
          disabled={clicked}
          sx={{
            backgroundColor: "#4e54c8",
            textTransform: "none",
            fontSize: "1rem",
            borderRadius: 2,
            padding: "10px 0",
            "&:hover": {
              backgroundColor: "#373dbb",
            },
            marginTop: 2,
          }}
        >
          {clicked ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Sign Up"
          )}
        </Button>

        {error && (
          <div className=" text-red-700 px-4 py-3 relative">{error}</div>
        )}

        <div className="text-center mt-2">
          Already have an account?{" "}
          <Link to="/admin-signin" className="text-[#4e54c8] font-semibold">
            Sign in
          </Link>
        </div>
      </Box>
    </Box>
  );
};

export default AdminSignup;
