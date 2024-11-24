import {
  AppBar,
  Box,
  Button,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
} from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../utils";

const Header = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decode = jwtDecode(token);
      setUserRole(decode.role);
    }
  }, []);

  const handleLogout = () => {
    if (userRole === "User") {
      navigate("/user-signin");
    } else if (userRole === "Admin") {
      navigate("/admin-signin");
    }
    localStorage.removeItem("token");
  };

  const fetchUsers = async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      setMessage("");
      setAnchorEl(null);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/v1/admin/finduser/${query}`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      );
      setSearchResults(response.data);
      if (response.data.length === 0) {
        setMessage("No user found");
      }
      setAnchorEl(document.getElementById("search-box"));
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("Error fetching users");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setUserName(query);
    fetchUsers(query);
  };

  const handleSelectUser = (user) => {
    setUserName(user.name);
    setSearchResults([]);
    setMessage("");
    setAnchorEl(null);
    console.log(user);
    navigate(`/user/${user.id}`);
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#f5f5f5",
        boxShadow: "none",
        color: "#000",
        height: "70px",
        mb: 5,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Link
            to={userRole === "User" ? "/usertasks" : "/users"}
            className="text-black font-bold text-2xl"
          >
            Task Management
          </Link>

          {userRole === "Admin" && (
            <Box sx={{ position: "relative", width: "300px" }}>
              <TextField
                id="search-box"
                label="Search User"
                variant="standard"
                value={userName}
                onChange={handleSearchChange}
                fullWidth
              />
              <Menu
                anchorEl={anchorEl}
                open={
                  Boolean(anchorEl) &&
                  (loading || searchResults.length > 0 || message)
                }
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  style: {
                    maxHeight: 200,
                    width: "300px",
                  },
                }}
              >
                {loading && <MenuItem disabled>Loading...</MenuItem>}
                {message && !loading && <MenuItem disabled>{message}</MenuItem>}
                {!loading &&
                  searchResults.map((user, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => handleSelectUser(user)}
                    >
                      {user.name}
                    </MenuItem>
                  ))}
              </Menu>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {userRole === "User" && (
            <Button
              variant="contained"
              onClick={() => navigate("/mytasks")}
              sx={{
                backgroundColor: "#1976d2",
                color: "#ffffff",
                textTransform: "none",
                borderRadius: "20px",
                px: 3,
                py: 1,
                fontSize: "1rem",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }}
            >
              My Tasks
            </Button>
          )}
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontSize: "1rem",
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
