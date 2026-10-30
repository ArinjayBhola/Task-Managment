export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

export type Variables = {
  jwtPayload: { id: string; email?: string; role?: string; exp?: number };
  userId: string;
  orgId: string;
  role: 'owner' | 'admin' | 'member';
};
