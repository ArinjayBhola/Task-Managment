import React from "react";
import { Inbox, CheckCircle2, Layout, Settings, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "../../store/ui";
import { cn } from "../../lib/utils";
import { NavLink } from "react-router-dom";

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { name: "Inbox", icon: Inbox, path: "/inbox" },
    { name: "My Tasks", icon: CheckCircle2, path: "/my-tasks" },
    { name: "Projects", icon: Layout, path: "/projects" },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out h-screen",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-4 h-14 border-b">
        {isSidebarOpen && <span className="font-semibold tracking-tight">Antigravity</span>}
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-accent rounded-md transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )
            }
          >
            <item.icon size={18} />
            {isSidebarOpen && <span>{item.name}</span>}
          </NavLink>
        ))}

        <div className="mt-8">
          {isSidebarOpen && (
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Projects</span>
              <button className="hover:text-foreground"><Plus size={14} /></button>
            </div>
          )}
          {/* Project List Mockup */}
          <div className="space-y-1">
            {["Design System", "Edge Engine", "Marketing"].map((project) => (
              <button
                key={project}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                {isSidebarOpen && <span>{project}</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t h-14 flex items-center">
        <button className="flex items-center gap-3 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={18} />
          {isSidebarOpen && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};
