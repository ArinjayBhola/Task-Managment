import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const admins = pgTable("Admin", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").default("Admin").notNull(),
});

export const users = pgTable("User", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").default("User").notNull(), // Legacy role, can keep for now
});

export const organizations = pgTable("Organization", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const organizationMembers = pgTable("OrganizationMember", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("MEMBER").notNull(), // E.g., OWNER, ADMIN, MEMBER
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("org_user_unq").on(t.organizationId, t.userId),
}));

export const tasks = pgTable("Task", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: integer("userId") // The creator of the task
    .references(() => users.id, { onDelete: "set null" }), 
  assignedTo: integer("assignedTo") // the user responsible for doing the task
    .references(() => users.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: text("status").default("Not Started").notNull(),
  comments: text("comments"),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasksCreated: many(tasks, { relationName: "creator" }),
  tasksAssigned: many(tasks, { relationName: "assignee" }),
  organizationMemberships: many(organizationMembers),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  tasks: many(tasks),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [tasks.userId],
    references: [users.id],
    relationName: "creator",
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
}));
