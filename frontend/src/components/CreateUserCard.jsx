import api from "../utils/axiosInstance";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleCreateUser } from "../redux/slice/createUserSlice";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import PasswordInput from "./ui/PasswordInput";
import { Button } from "./ui/Button";
import { Notice } from "./workspace/WorkspaceUI";
import { ArrowRight, Loader2, Users } from "lucide-react";
export default function CreateUserCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const close = () => {
    if (!loading) dispatch(toggleCreateUser());
  };
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/admin/usersignup", {
        name,
        email,
        password,
      });
      dispatch(toggleCreateUser());
      navigate(`/user/${data.id}`);
    } catch (failure) {
      setError(
        failure.response?.data?.message ||
          "We couldn’t add this teammate. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal isOpen onClose={close} title="A new face on your team">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Users size={19} />
        </span>
        <p className="text-xs leading-6 text-muted-foreground">
          Create their account and a workspace. Share the credentials with your
          teammate so they can get started.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Full name"
          placeholder="e.g. Alex Morgan"
          autoComplete="name"
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="alex@company.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
          maxLength={256}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Notice>{error}</Notice>}
        <div className="flex justify-end gap-2 border-t border-border pt-5">
          <Button variant="outline" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                Create member
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
