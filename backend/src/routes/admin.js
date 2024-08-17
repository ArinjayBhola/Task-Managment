import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { authentication } from "../middleware/auth";
import { signinSchema, signupSchema, taskSchema } from "../utils";

export const adminRouter = new Hono();

adminRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const parsedBody = signupSchema.safeParse(body);
  if (!parsedBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { name, email, password } = body;
  try {
    const signupAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password,
      },
    });
    const token = await sign(
      { id: signupAdmin.id, email: signupAdmin.email, role: signupAdmin.role },
      c.env.JWT_SECRET,
    );
    return c.json({ token });
  } catch (error) {
    return c.status(403);
  }
});

adminRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const parsedBody = signinSchema.safeParse(body);
  if (!parsedBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { email, password } = body;
  try {
    const signinAdmin = await prisma.admin.findFirst({
      where: {
        email,
        password,
      },
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
    return c.status(403);
  }
});

adminRouter.get("/bulk", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const users = await prisma.user.findMany({
      include: {
        task: true,
      },
    });
    if (users.length === 0) {
      c.status(411);
      return c.json({ error: "Users not found" });
    }
    return c.json(users);
  } catch (error) {
    return c.status(411);
  }
});

adminRouter.get("/:userId", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const { userId } = c.req.param();
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
      include: {
        task: true,
        password: false,
      },
    });
    if (!user) {
      c.status(404);
      return c.json({ msg: "User not found" });
    } else {
      return c.json(user);
    }
  } catch (error) {
    console.error("Error querying the database:", error);
    return c
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.post("/task", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

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

    await prisma.task.create({
      data: {
        userId: id,
        description,
        status,
        dueDate: parsedDueDate,
        comments,
      },
    });

    return c.json({ msg: "Task created successfully" });
  } catch (error) {
    console.error("Error querying the database:", error);
    return c
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

adminRouter.post("/usersignup", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const parsedBody = signupSchema.safeParse(body);
  if (!parsedBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { name, email, password } = body;
  try {
    const signupUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    const token = await sign(
      { id: signupUser.id, email: signupUser.email },
      c.env.JWT_SECRET,
    );
    return c.json({ id: signupUser.id });
  } catch (error) {
    return c.status(411);
  }
});

adminRouter.put("/admincomment", authentication, async (c) => {
  const prima = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { comment, taskId, usersId } = body;
  try {
    const commentUpdate = await prima.task.update({
      where: {
        userId: usersId,
        id: taskId,
      },
      data: {
        comments: comment,
      },
    });
    return c.json(commentUpdate);
  } catch (error) {
    console.error("Error querying the database:", error);
    return c
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.get("/task/:taskId", authentication, async (c) => {
  const prima = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { taskId } = c.req.param();
  try {
    const task = await prima.task.findUnique({
      where: {
        id: parseInt(taskId),
      },
      include: {
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
    return c
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
});

adminRouter.get("/user/:userId", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const { userId } = c.req.param();
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
      include: {
        password: false,
        task: true,
      },
    });
    if (!user) {
      c.status(404);
      return c.json({ msg: "User not found" });
    } else {
      return c.json(user);
    }
  } catch (error) {
    console.error("Error querying the database:", error);
    return c
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
});
