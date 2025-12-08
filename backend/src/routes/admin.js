import { Hono } from "hono";
import { sign } from "hono/jwt";
import { authentication } from "../middleware/auth";
import { signinSchema, signupSchema, taskSchema } from "../utils";
import { getDb } from "../db";
import { admins, users, tasks } from "../db/schema";
import { eq, and, ilike } from "drizzle-orm";

export const adminRouter = new Hono();

adminRouter.post("/signup", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const body = await c.req.json();
  const parsedBody = signupSchema.safeParse(body);
  if (!parsedBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { name, email, password } = body;
  try {
    const [signupAdmin] = await db
      .insert(admins)
      .values({
        name,
        email,
        password,
        role: "Admin",
      })
      .returning();

    const token = await sign(
      { id: signupAdmin.id, email: signupAdmin.email, role: signupAdmin.role },
      c.env.JWT_SECRET,
    );
    return c.json({ token });
  } catch (error) {
    return c.json({ error: "Error creating admin" }, 403);
  }
});

adminRouter.post("/signin", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const body = await c.req.json();
  const parsedBody = signinSchema.safeParse(body);
  if (!parsedBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { email, password } = body;
  try {
    const signinAdmin = await db.query.admins.findFirst({
      where: and(eq(admins.email, email), eq(admins.password, password)),
    });

    if (!signinAdmin) {
      c.status(403);
      return c.json({ error: "Admin not found" });
    }
    const token = await sign(
      { id: signinAdmin.id, email: signinAdmin.email, role: signinAdmin.role },
      c.env.JWT_SECRET,
    );
    return c.json({ token });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error signing in" }, 403);
  }
});

adminRouter.get("/bulk", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        tasks: true,
      },
    });

    if (allUsers.length === 0) {
      c.status(411);
      return c.json({ error: "Users not found" });
    }
    return c.json(allUsers);
  } catch (error) {
    return c.json({ error: "Error fetching users" }, 411);
  }
});

adminRouter.get("/:userId", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const { userId } = c.req.param();
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId)),
      with: {
        tasks: true,
      },
    });

    if (!user) {
      c.status(404);
      return c.json({ msg: "User not found" });
    } else {
      const { password, ...userWithoutPassword } = user;
      return c.json(userWithoutPassword);
    }
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.post("/task", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const createUTCDate = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  try {
    const body = await c.req.json();
    const parsedBody = taskSchema.safeParse(body);

    if (!parsedBody.success) {
      c.status(400);
      return c.json({
        message: "Error in task creation",
        errors: parsedBody.error.errors,
      });
    }

    const { description, dueDate, status, id, comments } = parsedBody.data;
    const parsedDueDate = createUTCDate(dueDate);

    await db.insert(tasks).values({
      userId: id,
      description,
      status,
      dueDate: parsedDueDate,
      comments,
    });

    return c.json({ msg: "Task created successfully" });
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

adminRouter.post("/usersignup", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const body = await c.req.json();
  const parsedBody = signupSchema.safeParse(body);
  if (!parsedBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { name, email, password } = body;
  try {
    const [signupUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password,
      })
      .returning();

    const token = await sign({ id: signupUser.id, email: signupUser.email }, c.env.JWT_SECRET);
    return c.json({ id: signupUser.id });
  } catch (error) {
    return c.json({ error: "Error creating user" }, 411);
  }
});

adminRouter.put("/admincomment", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { comment, taskId, usersId } = body;
  try {
    const [commentUpdate] = await db
      .update(tasks)
      .set({ comments: comment })
      .where(and(eq(tasks.userId, usersId), eq(tasks.id, taskId)))
      .returning();
    return c.json(commentUpdate);
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.get("/task/:taskId", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { taskId } = c.req.param();
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, parseInt(taskId)),
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

adminRouter.get("/user/:userId", async (c) => {
  // Duplicate route logic effectively, can reuse
  const db = getDb(c.env.DATABASE_URL);
  try {
    const { userId } = c.req.param();
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId)),
      with: {
        tasks: true,
      },
    });

    if (!user) {
      c.status(404);
      return c.json({ msg: "User not found" });
    } else {
      const { password, ...userWithoutPassword } = user;
      return c.json(userWithoutPassword);
    }
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.delete("/delete", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const { taskId } = await c.req.json();
    const [deleteTask] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();

    if (deleteTask) {
      return c.json({ msg: "Task deleted successfully" });
    }
    return c.status(404).json({ msg: "Task not found" });
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.get("/finduser/:userName", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const { userName } = c.req.param();
    const user = await db.query.users.findMany({
      where: ilike(users.name, `%${userName}%`),
    });
    if (!user) {
      c.status(404);
      return c.json({ msg: "User not found" });
    } else {
      return c.json(user);
    }
  } catch (error) {
    console.error("Error querying the database:", error);
    return c.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
});
