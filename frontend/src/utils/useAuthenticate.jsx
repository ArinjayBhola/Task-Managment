import { useNavigate } from "react-router-dom";

const useAuthenticate = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    setTimeout(() => {
      navigate("/");
    }, 0);
    return false;
  }

  return true;
};

export default useAuthenticate;
