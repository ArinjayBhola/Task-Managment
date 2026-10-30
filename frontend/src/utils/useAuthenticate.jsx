import { useAuth } from "../hooks/useAuth";
export default function useAuthenticate() {
  return !!useAuth().user;
}
