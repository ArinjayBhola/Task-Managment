import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { createSessionApi } from "./routes/session-api";
import { createTaskApi } from "./routes/task-api";
import { Bindings, Variables } from "./types";
import { createAdminAuthRouter } from "./routes/admin-auth";
import { getDb } from "./db";
import { createUserAuthRouter } from "./routes/user-auth";

export function createApp(databaseFactory = getDb) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  const allowed = (origin: string, url: string, configured?: string) => {
    if (!origin) return false;
    if (
      origin === new URL(url).origin ||
      configured
        ?.split(",")
        .map((value) => value.trim())
        .includes(origin)
    )
      return true;
    const host = new URL(url).hostname;
    return (
      ["127.0.0.1", "localhost", "[::1]"].includes(host) &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    );
  };
  app.use("*", secureHeaders());
  app.use("*", bodyLimit({ maxSize: 100 * 1024 }));
  app.use("*", async (c, next) => {
    c.set("databaseFactory", databaseFactory);
    c.header("Cache-Control", "no-store");
    await next();
  });
  app.use(
    "*",
    cors({
      origin: (origin, c) =>
        allowed(origin, c.req.url, c.env.APP_ORIGIN) ? origin : "",
      credentials: true,
    }),
  );
  app.use("*", async (c, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      const origin = c.req.header("Origin");
      if (
        (origin && !allowed(origin, c.req.url, c.env.APP_ORIGIN)) ||
        (!origin && c.req.header("Cookie")?.includes("tm_session="))
      )
        return c.json({ message: "Request origin is not allowed." }, 403);
    }
    await next();
  });
  app.route("/", createSessionApi());
  app.route("/", createTaskApi(databaseFactory));
  app.route("/api/v1/admin", createAdminAuthRouter(databaseFactory));
  app.route("/api/v1/user", createUserAuthRouter(databaseFactory));

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.onError((_error, c) =>
    c.json(
      { message: "The service is temporarily unavailable. Please try again." },
      503,
    ),
  );

  return app;
}

export default createApp();
