import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  ArrowUpRight,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Users,
  X,
  Building2,
  ShieldCheck,
} from "lucide-react";
import Brand from "./Brand";
import { ThemeToggle } from "./ThemeProvider";
import api from "../utils/axiosInstance";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  let account = {};
  try {
    account = jwtDecode(localStorage.getItem("token") || "");
  } catch {
    /* Protected routes handle missing sessions. */
  }
  const admin = account.role === "Admin";
  const email = account.email || (admin ? "Administrator" : "Team member");
  const home = admin ? "/users" : "/mytasks";
  const links = admin
    ? [{ to: "/users", label: "Team overview", icon: LayoutDashboard }]
    : [
        { to: "/mytasks", label: "My tasks", icon: ListTodo },
        { to: "/usertasks", label: "Team overview", icon: Users },
      ];
  const active =
    location.pathname === "/mytasks"
      ? "My tasks"
      : location.pathname === "/users" || location.pathname === "/usertasks"
        ? "Team overview"
        : location.pathname.startsWith("/user/")
          ? "Team member"
          : "Task details";
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!admin)
      api
        .get("/user/organizations")
        .then(({ data }) => setOrganizations(data))
        .catch(() => {});
  }, [admin]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    if (window.matchMedia("(max-width: 1023px)").matches)
      document.body.style.overflow = "hidden";
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeOrgId");
    navigate(admin ? "/admin-signin" : "/user-signin");
  };
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        aria-label="Workspace navigation"
        className={`fixed inset-y-0 left-0 z-50 w-60 flex-col border-r border-border bg-card ${open ? "flex" : "hidden lg:flex"}`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Brand to={home} />
          <button
            aria-label="Close menu"
            className="p-1 text-muted-foreground lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-4 mb-8 flex items-center gap-3 rounded-lg border border-border bg-background p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-primary">
            {admin ? <ShieldCheck size={18} /> : <Building2 size={18} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">
              {admin ? "Admin workspace" : "Team workspace"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {admin ? "Manage & organize" : "Focus & collaborate"}
            </p>
          </div>
        </div>
        <p className="eyebrow px-6 pb-3">Workspace</p>
        <nav className="space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        {organizations.length > 0 && (
          <div className="mx-4 mt-6">
            <label htmlFor="workspace-select" className="eyebrow mb-2 block">
              Your workspace
            </label>
            <select
              id="workspace-select"
              aria-label="Active workspace"
              className="field !py-2 text-xs"
              value={localStorage.getItem("activeOrgId") || organizations[0].id}
              onChange={(event) => {
                localStorage.setItem("activeOrgId", event.target.value);
                window.location.reload();
              }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mx-4 mt-auto mb-5 rounded-xl border border-border bg-background p-4">
          <span className="mb-3 block text-primary">
            <ArrowUpRight size={20} />
          </span>
          <p className="text-sm font-semibold">A little more organized.</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Less busywork. More room for the work that matters.
          </p>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {email[0].toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" title={email}>
                {email}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {admin ? "Administrator" : "Member"}
              </p>
            </div>
            <button
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="rounded-lg p-1 text-muted-foreground lg:hidden"
          >
            <Menu size={21} />
          </button>
          <Link
            to={home}
            className="hidden text-xs text-muted-foreground sm:block"
          >
            Workspace
          </Link>
          <ChevronRight
            size={13}
            className="hidden text-muted-foreground sm:block"
          />
          <span className="text-xs font-medium">{active}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-muted-foreground md:block">
            {new Intl.DateTimeFormat("en", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }).format(new Date())}
          </span>
          <ThemeToggle />
        </div>
      </header>
    </>
  );
}
