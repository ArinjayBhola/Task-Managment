import { verify } from "hono/jwt";

export const authentication = async (c, next) => {
  const jwt_token = c.req.header("Authorization");
  if (!jwt_token) {
    return c.status(403).json({ message: "Unauthorized" });
  }
  const payload = await verify(jwt_token, c.env.JWT_SECRET);
  if (payload.id) {
    await next();
  } else {
    return c.status(403).json({ message: "Unauthorized" });
  }
};
