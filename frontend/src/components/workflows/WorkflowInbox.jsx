import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import Popover from "@mui/material/Popover";
import api from "../../utils/axiosInstance";
import { notify } from "../../utils/notifications";
import { useAuth } from "../../hooks/useAuth";

export default function WorkflowInbox() {
  const [items, setItems] = useState([]),
    [anchor, setAnchor] = useState(null);
  const navigate = useNavigate(),
    { user } = useAuth();
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await api.get("/workflow-notifications");
        if (active) setItems(Array.isArray(data) ? data : []);
      } catch {
        /* Keep navigation available during a temporary inbox outage. */
      }
    }
    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const unread = items.filter((item) => !item.read_at).length;
  async function markRead() {
    try {
      await api.post("/workflow-notifications/read");
      setItems((previous) =>
        previous.map((item) => ({
          ...item,
          read_at: new Date().toISOString(),
        })),
      );
    } catch {
      notify("Unable to mark notifications as read.", "error");
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={(event) => setAnchor(event.currentTarget)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[9px] text-primary-foreground">
            {unread}
          </span>
        )}
      </button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <div className="w-[340px] max-w-[90vw] bg-card text-foreground">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={markRead}
                className="text-xs text-primary"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length ? (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`block w-full border-b border-border p-4 text-left hover:bg-muted ${!item.read_at ? "bg-accent/50" : ""}`}
                  onClick={() => {
                    setAnchor(null);
                    if (user.role === "Admin" && item.run_id)
                      navigate(`/admin/workflows/runs/${item.run_id}`);
                    else if (item.task_id)
                      navigate(`/user-edittask/${item.task_id}`);
                  }}
                >
                  <span className="block text-xs leading-5">
                    {item.message}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </button>
              ))
            ) : (
              <p className="p-8 text-center text-xs text-muted-foreground">
                You’re all caught up.
              </p>
            )}
          </div>
        </div>
      </Popover>
    </>
  );
}
