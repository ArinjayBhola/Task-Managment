import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Search, UserCircle, Building2, ChevronDown } from "lucide-react";
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
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decode = jwtDecode(token);
        setUserRole(decode.role);
        fetchOrganizations();
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get("/user/organizations");
      setOrganizations(response.data);
      
      const savedOrgId = localStorage.getItem("activeOrgId");
      if (savedOrgId) {
        const org = response.data.find(o => o.id.toString() === savedOrgId);
        if (org) setActiveOrg(org);
      } else if (response.data.length > 0) {
        setActiveOrg(response.data[0]);
        localStorage.setItem("activeOrgId", response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching organizations", error);
    }
  };

  const handleOrgSwitch = (org) => {
    localStorage.setItem("activeOrgId", org.id);
    setActiveOrg(org);
    setShowOrgDropdown(false);
    window.location.reload(); // Refresh to load tasks for the new workspace
  };

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
      const response = await api.get(`/admin/finduser/${query}`);
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
        
        {/* Workspace Switcher */}
        {activeOrg && (
          <div className="relative hidden md:block ml-6">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/20 text-primary">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium text-white truncate max-w-[120px]">
                {activeOrg.name}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </button>

            <AnimatePresence>
              {showOrgDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-12 left-0 w-64 bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 py-2"
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Workspaces</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleOrgSwitch(org)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors ${
                          org.id === activeOrg.id ? "bg-primary/10 text-primary" : "text-white"
                        }`}
                      >
                        <span className="text-sm truncate mr-2">{org.name}</span>
                        <span className="text-xs py-0.5 px-2 rounded-full bg-white/10 text-muted-foreground border border-white/5">
                           {org.role.toLowerCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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
