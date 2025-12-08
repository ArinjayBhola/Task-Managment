import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { authentication } from "../middleware/auth";
import { signinSchema } from "../utils";
import { getDb } from "../db";
import { users, tasks } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const userRouter = new Hono();

userRouter.post("/signin", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const body = await c.req.json();
  const parseBody = signinSchema.safeParse(body);
  if (!parseBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { email, password } = body;
  try {
    const signinUser = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.password, password)),
    });

    if (!signinUser) {
      c.status(403);
      return c.json({ error: "user not found" });
    }
    const token = await sign({ email: signinUser.email, id: signinUser.id, role: signinUser.role }, c.env.JWT_SECRET);
    return c.json({ token });
  } catch (error) {
    console.error("Signin Error:", error);
    return c.json({ error: "Error signing in" }, 403);
  }
});

userRouter.get("/bulk", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const authHeader = c.req.header("Authorization");
    const decodedValue = await verify(authHeader, c.env.JWT_SECRET);
    const { id } = decodedValue;
    const userTasks = await db.query.users.findMany({
      where: eq(users.id, id),
      with: {
        tasks: true,
      },
    });
    return c.json(userTasks);
  } catch (error) {
    return c.json({ error: "Error fetching tasks" }, 411);
  }
});

userRouter.put("/taskupdate", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const body = await c.req.json();
    const { comments, status, taskId } = body;
    const authHeader = c.req.header("Authorization");
    const decodedValue = await verify(authHeader, c.env.JWT_SECRET);
    const { id } = decodedValue;

    const data = {};
    if (status !== undefined) data.status = status;
    if (comments !== undefined) data.comments = comments;

    const [taskUpdate] = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.userId, id), eq(tasks.id, taskId)))
      .returning();

    return c.json(taskUpdate);
  } catch (error) {
    return c.json({ error: error.message }, 411);
  }
});

userRouter.get("/bulktask", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        tasks: true,
      },
    });

    return c.json(allUsers);
  } catch (error) {
    return c.json({ error: "Error fetching tasks" }, 411);
  }
});

userRouter.get("/bulktask/:id", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const { id } = c.req.param();
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, parseInt(id)),
      with: {
        user: true,
      },
    });

    if (!task) {
      c.status(404);
      return c.json({ msg: "Task not found" });
    } else {
      return c.json(task);
    }
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
});
