export function notify(message, severity = "success") {
  window.dispatchEvent(
    new CustomEvent("app-notification", { detail: { message, severity } }),
  );
}
