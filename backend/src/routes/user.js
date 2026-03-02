import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { authentication } from "../middleware/auth";
import { signinSchema } from "../utils";
import { getDb } from "../db";
import { users, tasks, organizationMembers } from "../db/schema";
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
  const orgId = c.get("orgId");
  
  if (!orgId) {
    return c.json({ error: "Organization ID is required" }, 400);
  }

  try {
    const payload = c.get("jwtPayload");
    const { id } = payload;
    
    // Fetch the user and only tasks assigned to them within the current organization
    const userTasks = await db.query.users.findMany({
      where: eq(users.id, id),
      with: {
        tasksAssigned: {
          where: eq(tasks.organizationId, orgId)
        },
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
  const orgId = c.get("orgId");
  
  if (!orgId) {
    return c.json({ error: "Organization ID is required" }, 400);
  }

  try {
    // Fetch users in the org and their assigned tasks in the org
    const members = await db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, orgId),
      with: {
        user: {
           with: {
             tasksAssigned: {
               where: eq(tasks.organizationId, orgId)
             },
           }
        }
      },
    });

    const allUsers = members.map(m => m.user);
    return c.json(allUsers);
  } catch (error) {
    return c.json({ error: "Error fetching tasks" }, 411);
  }
});

userRouter.get("/bulktask/:id", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get("orgId");
  
  if (!orgId) {
    return c.json({ error: "Organization ID is required" }, 400);
  }

  try {
    const { id } = c.req.param();
    const task = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, parseInt(id)),
        eq(tasks.organizationId, orgId) // Ensure task belongs to the active org
      ),
      with: {
        assignee: true,
        creator: true
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

// NEW ENDPOINT: Get all organizations for the frontend switcher
userRouter.get("/organizations", authentication, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    const payload = c.get("jwtPayload");
    const userOrgs = await db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, payload.id),
      with: {
        organization: true
      }
    });

    const orgs = userOrgs.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role
    }));

    return c.json(orgs);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Error fetching organizations" }, 500);
  }
});
