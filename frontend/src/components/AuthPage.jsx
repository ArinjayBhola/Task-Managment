/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { notify } from "../utils/notifications";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import api from "../utils/axiosInstance";
import Brand from "./Brand";
import { ThemeToggle } from "./ThemeProvider";
import { Input } from "./ui/Input";
import PasswordInput from "./ui/PasswordInput";
import { Button } from "./ui/Button";

export default function AuthPage({ role = "Admin", signup = false }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { user: existing, setUser } = useAuth();
  if (existing)
    return (
      <Navigate
        to={existing.role === "Admin" ? "/users" : "/mytasks"}
        replace
      />
    );
  const admin = role === "Admin";
  const title = signup
    ? "Your team starts here."
    : admin
      ? "Welcome back, admin."
      : "Your work starts here.";
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(
        `/${admin ? "admin" : "user"}/${signup ? "signup" : "signin"}`,
        { ...(signup ? { name } : {}), email, password },
      );
      if (!data.user) throw new Error("Unable to sign in. Please try again.");
      setUser(data.user);
      notify(signup ? "Account created." : "Welcome back.");
      navigate(admin ? "/users" : "/mytasks", { replace: true });
    } catch (failure) {
      notify(
        failure.response?.data?.message ||
          "Unable to sign in. Please try again.",
        "error",
      );
      setError(
        failure.response?.data?.message ||
          failure.response?.data?.error ||
          failure.message ||
          "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-dvh bg-card">
      <main className="grid min-h-dvh w-full lg:grid-cols-2">
        <section className="hidden min-h-dvh flex-col bg-accent px-10 py-7 lg:flex xl:px-16">
          <Brand />
          <div className="my-auto py-10">
            <div>
              <p className="eyebrow !text-accent-foreground">
                {admin
                  ? "Admin console · Team operations"
                  : "Member dashboard · Personal focus"}
              </p>
              <h1 className="mt-6 max-w-xl text-[clamp(44px,4.4vw,76px)] font-medium leading-[1.04] tracking-[-2px]">
                {admin ? "Your team." : "Your work."}
                <br />
                {admin ? "Your direction." : "Your rhythm."}
                <br />
                <span className="text-primary">
                  {admin ? "In one place." : "Your progress."}
                </span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
                Bring your people and priorities together. A thoughtful
                dashboard for getting things done, one task at a time.
              </p>
            </div>
            <div className="mt-9 max-w-md space-y-0">
              {[
                "A clear view of every priority",
                "Your team, moving together",
                "More focus. Less friction.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 border-t border-primary/10 py-3.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-primary">
                    <Check size={13} />
                  </span>
                  <span className="flex-1 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-primary/10 pt-5">
            <span className="text-xs text-muted-foreground">
              Make room for meaningful work.
            </span>
            <ArrowUpRight size={19} className="text-primary" />
          </div>
        </section>
        <section className="flex min-h-dvh flex-col px-6 py-5 sm:px-10 lg:px-14">
          <div className="flex h-10 shrink-0 items-center justify-between">
            <span className="lg:invisible">
              <Brand />
            </span>
            <ThemeToggle />
          </div>
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-[440px]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
                {admin ? <ShieldCheck size={21} /> : <Users size={21} />}
              </div>
              <p className="eyebrow mb-2">
                {signup
                  ? "Administrator sign up"
                  : admin
                    ? "Administrator sign in"
                    : "Team member sign in"}
              </p>
              <h2 className="text-[30px] font-semibold leading-tight tracking-[-1px] sm:text-[34px]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {signup
                  ? "Create an admin account to organize your team and their next great idea."
                  : "Sign in to pick up where you left off."}
              </p>
              <form onSubmit={submit} className="mt-5 space-y-4">
                {signup && (
                  <Input
                    label="Full name"
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    maxLength={200}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <PasswordInput
                  placeholder={
                    signup ? "At least 15 characters" : "Enter your password"
                  }
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  minLength={signup ? 15 : 1}
                  maxLength={signup ? 128 : 256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs leading-5 text-destructive"
                  >
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {signup ? "Create account" : "Sign in"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                {admin ? (
                  <>
                    {signup
                      ? "Already have an account?"
                      : "Need an admin account?"}{" "}
                    <Link
                      className="font-semibold text-primary hover:underline"
                      to={signup ? "/admin-signin" : "/admin-signup"}
                    >
                      {signup ? "Sign in" : "Initial admin setup"}
                    </Link>
                  </>
                ) : (
                  <>Need an account? Ask your administrator.</>
                )}
              </div>
              <Link
                to={admin ? "/user-signin" : "/admin-signin"}
                className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {admin
                  ? "Sign in as a team member"
                  : "Sign in as an administrator"}
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} TaskMaster</span>
            <span className="flex items-center gap-1.5">
              <CheckCheck size={14} />A little more organized.
            </span>
          </footer>
        </section>
      </main>
    </div>
  );
}
