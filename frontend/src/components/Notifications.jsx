/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
export default function Notifications({ children }) {
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    const show = (event) =>
      setQueue((items) => [
        ...items,
        { ...event.detail, id: crypto.randomUUID() },
      ]);
    window.addEventListener("app-notification", show);
    return () => window.removeEventListener("app-notification", show);
  }, []);
  const current = queue[0];
  const close = (_event, reason) => {
    if (reason !== "clickaway") setQueue((items) => items.slice(1));
  };
  return (
    <>
      {children}
      <Snackbar
        key={current?.id || "empty"}
        open={!!current}
        autoHideDuration={5000}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={close}
          severity={current?.severity || "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {current?.message || ""}
        </Alert>
      </Snackbar>
    </>
  );
}
