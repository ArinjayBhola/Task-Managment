import { Hono } from "hono";
import { cors } from "hono/cors";
import { taskRouter } from "./routes/tasks";
import { authMiddleware } from "./middleware/auth";
import { Bindings, Variables } from "./types";
import { createAdminAuthRouter } from "./routes/admin-auth";
import { getDb } from "./db";
import { createUserAuthRouter } from "./routes/user-auth";

export function createApp(databaseFactory = getDb) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  app.use("*", cors());
  app.route("/api/v1/admin", createAdminAuthRouter(databaseFactory));
  app.route("/api/v1/user", createUserAuthRouter(databaseFactory));
  app.use("/api/v1/tasks/*", authMiddleware);

  app.route("/api/v1/tasks", taskRouter);

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  return app;
}

export default createApp();
