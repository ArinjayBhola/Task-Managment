import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  pgEnum,
  uuid,
  jsonb,
  primaryKey,
  foreignKey,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);
export const statusEnum = pgEnum("status", [
  "backlog",
  "todo",
  "in-progress",
  "done",
  "canceled",
]);
export const priorityEnum = pgEnum("priority", [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const adminAccounts = pgTable("admin_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  role: roleEnum("role").default("member").notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  assignedAdminId: uuid("assigned_admin_id").references(() => adminAccounts.id),
  adminNotes: text("admin_notes").notNull().default(""),
  memberNotes: text("member_notes").notNull().default(""),
  projectId: uuid("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: statusEnum("status").default("todo").notNull(),
  priority: priorityEnum("priority").default("none").notNull(),
  assigneeId: uuid("assignee_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .references(() => tasks.id)
    .notNull(),
  authorId: uuid("author_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .references(() => tasks.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => adminAccounts.id),
  latestVersion: integer("latest_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const workflowVersions = pgTable(
  "workflow_versions",
  {
    templateId: uuid("template_id")
      .notNull()
      .references(() => workflowTemplates.id),
    version: integer("version").notNull(),
    definition: jsonb("definition").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.templateId, table.version] })],
);
export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id").notNull(),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => adminAccounts.id),
    requestKey: uuid("request_key").notNull(),
    state: text("state").notNull().default("running"),
    lastError: text("last_error"),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.templateId, table.version],
      foreignColumns: [workflowVersions.templateId, workflowVersions.version],
    }),
    unique().on(table.createdBy, table.requestKey),
    check(
      "workflow_runs_state_check",
      sql`${table.state} IN ('running','completed','canceled')`,
    ),
    index("workflow_runs_pending")
      .on(table.checkedAt)
      .where(sql`${table.state}='running'`),
  ],
);
export const workflowSteps = pgTable(
  "workflow_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    nodeKey: text("node_key").notNull(),
    spec: jsonb("spec").notNull(),
    state: text("state").notNull().default("blocked"),
    taskId: uuid("task_id")
      .unique()
      .references(() => tasks.id, { onDelete: "restrict" }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    feedback: text("feedback").notNull().default(""),
    outcome: boolean("outcome"),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.runId, table.nodeKey),
    check(
      "workflow_steps_state_check",
      sql`${table.state} IN ('blocked','ready','in_progress','in_review','completed','canceled','skipped')`,
    ),
  ],
);
export const workflowEvents = pgTable(
  "workflow_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    nodeKey: text("node_key"),
    action: text("action").notNull(),
    actorId: uuid("actor_id"),
    actorRole: text("actor_role"),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("workflow_events_run").on(table.runId, table.createdAt)],
);
export const workflowNotices = pgTable(
  "workflow_notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull(),
    role: text("role").notNull(),
    message: text("message").notNull(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "workflow_notices_role_check",
      sql`${table.role} IN ('Admin','User')`,
    ),
    index("workflow_notice_inbox").on(
      table.accountId,
      table.role,
      table.createdAt.desc(),
    ),
  ],
);
