import { Button } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const decode = jwtDecode(token);
      if (decode.role === "Admin") {
        navigate("/users");
      } else if (decode.role === "User") {
        navigate("/usertasks");
      }
    }
  }, [token, navigate]);

  return (
    <div className="relative h-screen w-full">
      <img
        src="/task.png"
        alt="Task Management Background"
        className="absolute h-full w-full object-cover"
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center w-full bg-gradient-to-b from-black/70 to-black/40">
        <div className="text-center text-white px-6 md:px-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 md:mb-10">
            Welcome to <span className="text-blue-400">Task Management</span>{" "}
            App
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl font-light mb-8">
            Organize, Track, and Manage Your Tasks Seamlessly!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              component={Link}
              to="/admin-signin"
              variant="contained"
              color="primary"
              sx={{
                "&:hover": { transform: "scale(1.05)" },
                transition: "transform 0.3s ease-in-out",
                fontSize: "1rem",
                px: 4,
                py: 2,
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
                borderRadius: 4,
              }}
            >
              Login as Admin
            </Button>
            <Button
              component={Link}
              to="/user-signin"
              variant="contained"
              color="success"
              sx={{
                "&:hover": { transform: "scale(1.05)" },
                transition: "transform 0.3s ease-in-out",
                fontSize: "1rem",
                px: 4,
                py: 2,
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
                borderRadius: 4,
              }}
            >
              Login as User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
