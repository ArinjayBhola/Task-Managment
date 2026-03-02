import api from "../utils/axiosInstance";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleCreateUser } from "../redux/slice/createUserSlice";
import { BACKEND_URL } from "../utils";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const CreateUserCard = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const postUser = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.post(`/admin/usersignup`, { name, email, password });
      if (response.status === 200) {
        setSuccessMessage("User created successfully!");
        setTimeout(() => {
          navigate(`/user/${response.data.id}`);
          dispatch(toggleCreateUser());
        }, 1000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => dispatch(toggleCreateUser())}
      title="Create New User">
      <div className="space-y-4">
        {successMessage && (
          <div className="p-3 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-md">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
            {errorMessage}
          </div>
        )}

        <Input
          label="Name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <Input
            label="Password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-3 top-[34px] text-muted-foreground hover:text-white transition-colors">
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="pt-2">
          <Button
            className="w-full"
            onClick={postUser}
            disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateUserCard;
