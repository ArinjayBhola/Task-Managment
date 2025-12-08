import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Search, UserCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { BACKEND_URL } from "../utils";

const Header = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decode = jwtDecode(token);
        setUserRole(decode.role);
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (userRole === "User") {
      navigate("/user-signin");
    } else {
      navigate("/admin-signin");
    }
  };

  const fetchUsers = async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/admin/finduser/${query}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      setSearchResults(response.data);
      if (response.data.length === 0) {
        setMessage("No user found");
      }
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
    setShowSearch(true);
  };

  const handleSelectUser = (user) => {
    setUserName(user.name);
    setSearchResults([]);
    setMessage("");
    setShowSearch(false);
    navigate(`/user/${user.id}`);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={userRole === "User" ? "/usertasks" : "/users"}
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
          TaskMaster
        </Link>

        <div className="flex items-center gap-4">
          {userRole === "Admin" && (
            <div className="relative w-64 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userName}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  className="w-full h-10 pl-9 pr-4 rounded-full bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
              </div>

              <AnimatePresence>
                {showSearch && (searchResults.length > 0 || message) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-12 left-0 w-full bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {loading && <div className="p-3 text-sm text-muted-foreground">Loading...</div>}
                    {message && !loading && <div className="p-3 text-sm text-muted-foreground">{message}</div>}
                    {!loading &&
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm">
                          <UserCircle className="w-4 h-4 text-primary" />
                          {user.name}
                        </div>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-2">
            {userRole === "User" && (
              <Link to="/mytasks">
                <Button
                  variant="ghost"
                  size="sm">
                  My Tasks
                </Button>
              </Link>
            )}

            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
