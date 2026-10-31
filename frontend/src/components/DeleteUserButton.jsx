/* eslint-disable react/prop-types */
import { useState } from "react";
import { Trash2 } from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { notify } from "../utils/notifications";
import api from "../utils/axiosInstance";

export default function DeleteUserButton({ user, onDeleted }) {
  const [open, setOpen] = useState(false),
    [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const confirmed =
    confirmation.trim().toLowerCase() === user.email?.toLowerCase();
  async function remove(event) {
    event.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/admin/user/${user.id}`, {
        data: { confirmEmail: confirmation.trim() },
      });
      setOpen(false);
      notify("User and related data permanently deleted.");
      onDeleted?.();
    } catch (failure) {
      const message =
        failure.response?.data?.message ||
        "Unable to delete this user. Please retry.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setConfirmation("");
          setError("");
          setOpen(true);
        }}
      >
        <Trash2 size={16} />
        Delete user
      </Button>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={remove}>
          <DialogTitle>Delete {user.name || "this user"}?</DialogTitle>
          <DialogContent>
            <div className="space-y-4 text-sm leading-6">
              <p>
                This permanently deletes the account, their tasks, notes,
                comments, activity, notifications, and login sessions.
              </p>
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                <p className="font-semibold">This cannot be undone.</p>
                <p className="mt-2">
                  Running workflows involving this member will be canceled.
                  Other members’ work is kept, and workflow templates will need
                  reassignment.
                </p>
                <p className="mt-2">
                  Shared assignments stay, but their shared progress notes are
                  cleared.
                </p>
              </div>
              <p className="break-all text-muted-foreground">
                Type <strong className="text-foreground">{user.email}</strong>{" "}
                to confirm.
              </p>
              <Input
                label="Member email to confirm"
                type="email"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                required
                maxLength={320}
                error={error}
                disabled={busy}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Keep user
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!confirmed || busy}
            >
              {busy ? "Deleting…" : "Delete user permanently"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
