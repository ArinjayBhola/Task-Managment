export default function HomeShimmer() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      className="surface animate-pulse p-6"
    >
      <div className="mb-5 h-4 w-32 rounded bg-muted" />
      <div className="mb-3 h-3 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
