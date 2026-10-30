import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { LockKeyhole } from "lucide-react";
import { Button } from "./ui/Button";
import PasswordInput from "./ui/PasswordInput";
import api from "../utils/axiosInstance";
import { notify } from "../utils/notifications";
export default function AccountSecurity() {
  const [open, setOpen] = useState(false),
    [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false);
  const close = () => {
    if (!busy) {
      setOpen(false);
      setCurrent("");
      setPassword("");
      setConfirm("");
    }
  };
  async function save(event) {
    event.preventDefault();
    if (password !== confirm) {
      notify("New passwords do not match.", "error");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/password", {
        currentPassword: current,
        newPassword: password,
      });
      setOpen(false);
      setCurrent("");
      setPassword("");
      setConfirm("");
      notify("Password changed. Other sessions have been signed out.");
    } catch (error) {
      notify(
        error.response?.data?.message || "Unable to change password.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
      >
        <LockKeyhole size={15} />
        Change password
      </button>
      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <form onSubmit={save}>
          <DialogTitle>Change password</DialogTitle>
          <DialogContent>
            <p className="mb-5 text-xs leading-6 text-muted-foreground">
              Use a unique passphrase of at least 15 characters. Changing it
              signs out your other sessions.
            </p>
            <div className="space-y-5">
              <PasswordInput
                label="Current password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <PasswordInput
                label="New password"
                autoComplete="new-password"
                required
                minLength={15}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                required
                minLength={15}
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Update password
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
