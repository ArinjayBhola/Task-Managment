import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { authentication } from "../middleware/auth";
import { signinSchema } from "../utils";

export const userRouter = new Hono();

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const parseBody = signinSchema.safeParse(body);
  if (!parseBody.success) {
    c.status(411);
    return c.json({ message: "Credantials not valid" });
  }
  const { email, password } = body;
  try {
    const signinUser = await prisma.user.findFirst({
      where: {
        email,
        password,
      },
    });
    if (!signinUser) {
      c.status(403);
      return c.json({ error: "user not found" });
    }
    const token = await sign(
      { email: signinUser.email, id: signinUser.id, role: signinUser.role },
      c.env.JWT_SECRET,
    );
    return c.json({ token });
  } catch (error) {
    return c.status(403);
  }
});

userRouter.get("/bulk", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const authHeader = c.req.header("Authorization");
    const decodedValue = await verify(authHeader, c.env.JWT_SECRET);
    const { id } = decodedValue;
    const task = await prisma.user.findMany({
      where: {
        id,
      },
      include: {
        task: true,
      },
    });
    return c.json(task);
  } catch (error) {
    return c.status(411);
  }
});

userRouter.put("/taskupdate", authentication, async (c) => {
  const prima = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json();
    const { comments, status, taskId } = body;
    const authHeader = c.req.header("Authorization");
    const decodedValue = await verify(authHeader, c.env.JWT_SECRET);
    const { id } = decodedValue;

    const data = {};
    if (status !== undefined) data.status = status;
    if (comments !== undefined) data.comments = comments;

    const taskUpdate = await prima.task.update({
      where: {
        userId: id,
        id: taskId,
      },
      data: data,
    });
    return c.json(taskUpdate);
  } catch (error) {
    return c.status(411).json({ error: error.message });
  }
});

userRouter.get("/bulktask", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findMany({
      include: {
        task: true,
      },
    });
    return c.json(user);
  } catch (error) {
    return c.status(411);
  }
});

userRouter.get("/bulktask/:id", authentication, async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const { id } = c.req.param();
    const task = await prisma.task.findUnique({
      where: {
        id: parseInt(id),
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
