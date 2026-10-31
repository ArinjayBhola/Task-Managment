import { Routes, Route, Navigate } from "react-router-dom";
import { Index } from "./pages/Index";
import { Sidebar } from "./components/navigation/Sidebar";
import { CommandPalette } from "./components/navigation/CommandPalette";

const App = () => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-6 justify-between shrink-0 glass z-10">
          <div className="text-sm font-medium text-muted-foreground select-none">
            Workspace / <span className="text-foreground">Tasks</span>
          </div>
          <div className="flex items-center gap-4">
            <kbd className="hidden md:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-tasks" element={<Index />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <CommandPalette />
    </div>
  );
};

export default App;
