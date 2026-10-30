import { jwtDecode } from "jwt-decode";

const useAuthenticate = () => {
  try {
    const account = jwtDecode(localStorage.getItem("token") || "");
    return account.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

export default useAuthenticate;
