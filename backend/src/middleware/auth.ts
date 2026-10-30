import { Context, Next } from "hono";
import { jwt } from "hono/jwt";

export const authMiddleware = (c: Context, next: Next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: "HS256",
  });
  return jwtMiddleware(c, next);
};

export const getUserId = (c: Context) => {
  const payload = c.get("jwtPayload");
  return payload.id as string;
};
