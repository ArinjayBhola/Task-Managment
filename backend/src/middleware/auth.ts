import { Context, Next } from "hono";
import { readSession } from "../auth/sessions";
export const authMiddleware = async (c: Context, next: Next) => {
  const user = await readSession(c);
  if (!user)
    return c.json(
      { message: "Your session has expired. Please sign in again." },
      401,
    );
  c.set("currentUser", user);
  c.set("jwtPayload", { id: user.id, email: user.email, role: user.role });
  return next();
};
export const getUserId = (c: Context) => c.get("currentUser").id as string;
