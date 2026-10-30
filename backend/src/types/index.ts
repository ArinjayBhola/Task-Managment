export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_ORIGIN?: string;
};

export type Variables = {
  currentUser: import("../auth/sessions").SessionUser;
  databaseFactory: typeof import("../db").getDb;
  jwtPayload: { id: string; email?: string; role?: string; exp?: number };
  userId: string;
  orgId: string;
  role: "owner" | "admin" | "member";
};
