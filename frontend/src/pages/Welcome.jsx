import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  Layers3,
  ListTodo,
  ShieldCheck,
  Users,
} from "lucide-react";
import Brand from "../components/Brand";
import { ThemeToggle } from "../components/ThemeProvider";
import { Button } from "../components/ui/Button";
export default function Welcome() {
  const { user: account } = useAuth();
  if (account)
    return (
      <Navigate to={account.role === "Admin" ? "/users" : "/mytasks"} replace />
    );
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
        <Brand />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/user-signin"
            className="hidden text-xs font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            Member sign in
          </Link>
          <Link to="/admin-signin">
            <Button variant="outline" size="sm">
              Admin portal
              <ArrowUpRight size={13} />
            </Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 lg:px-10">
        <section className="grid items-center gap-12 pb-20 pt-12 lg:min-h-[610px] lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-24 lg:pt-14">
          <div>
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium uppercase tracking-[0.13em]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />A calmer
              way to work
            </p>
            <h1 className="max-w-lg text-[48px] font-medium leading-[1.08] tracking-[-2.5px] sm:text-[64px] lg:text-[70px]">
              Less scattered.
              <br />
              More{" "}
              <span className="font-serif italic text-primary">together.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
              A thoughtful home for your people, priorities, and next big idea.
              Find your focus and make a little progress, every day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/admin-signin">
                <Button size="lg">
                  Open admin console
                  <ArrowRight size={15} />
                </Button>
              </Link>
              <Link to="/user-signin">
                <Button variant="outline" size="lg">
                  Join your team
                </Button>
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Check size={13} className="text-primary" />
              Simple by design. Built around your team.
            </p>
          </div>
          <div className="relative rounded-2xl border border-border bg-accent p-4 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <span className="eyebrow !text-accent-foreground">
                A little clarity looks like this
              </span>
              <span className="text-primary">
                <Layers3 size={17} />
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                    <Check size={12} />
                  </span>
                  Your team at a glance
                </span>
                <span className="text-xs text-muted-foreground">
                  Preview
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs text-muted-foreground">
                  A fresh start. A clear direction.
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Let’s make things happen.
                </h2>
                <div className="my-5 grid grid-cols-3 gap-2">
                  {[
                    ["12", "On the list"],
                    ["4", "In motion"],
                    ["8", "All done"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border p-3"
                    >
                      <span className="text-xl font-semibold tracking-tight">
                        {value}
                      </span>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Today’s priorities</h3>
                  <span className="text-xs text-muted-foreground">
                    Keep it simple
                  </span>
                </div>
                {[
                  ["Map out the next big idea", "In progress"],
                  ["Bring the team up to speed", "To do"],
                  ["Celebrate a small win", "Completed"],
                ].map(([title, status], i) => (
                  <div
                    key={title}
                    className="flex items-center gap-2 border-t border-border py-3.5"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${i === 2 ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                    >
                      {i === 2 && <Check size={10} />}
                    </span>
                    <span className="min-w-0 flex-1 text-xs">{title}</span>
                    <span
                      className={`rounded px-1.5 py-1 text-[8px] ${i === 2 ? "bg-accent text-primary" : i === 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Circle size={8} className="fill-primary text-primary" />
                Everything has its place.
              </span>
              <span>Yours included.</span>
            </div>
          </div>
        </section>
        <section className="grid gap-8 border-t border-border py-12 md:grid-cols-3">
          {[
            {
              icon: ListTodo,
              number: "01",
              title: "Know what comes next.",
              description:
                "Clear tasks, thoughtful details, and deadlines that keep your day in perspective.",
            },
            {
              icon: Users,
              number: "02",
              title: "Move forward together.",
              description:
                "A shared view of your team’s work. Everyone knows where they fit.",
            },
            {
              icon: ShieldCheck,
              number: "03",
              title: "A place for everyone.",
              description:
                "Dedicated spaces for admins and team members, with just what each person needs.",
            },
          ].map(({ icon: Icon, number, title, description }) => (
            <article key={number}>
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-primary">
                  <Icon size={18} />
                </span>
                <span className="text-xs text-muted-foreground">{number}</span>
              </div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-7 text-xs text-muted-foreground lg:px-10">
        <span>
          © {new Date().getFullYear()} TaskMaster. A little more organized.
        </span>
        <Link
          to="/admin-signin"
          className="flex items-center gap-1 hover:text-primary"
        >
          Your dashboard awaits
          <ArrowUpRight size={12} />
        </Link>
      </footer>
    </div>
  );
}
