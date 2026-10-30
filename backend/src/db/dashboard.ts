import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { users, tasks } from "./schema";

// Read compatibility for the existing integer-ID database. These definitions
// are deliberately outside the migration schema; no existing tables are changed.
const legacyTasks = pgTable("tasks", {
  orgId: integer("organization_id"),
  id: integer("id"), title: text("title"), description: text("description"),
  status: text("status"), priority: text("priority"), dueDate: timestamp("due_date"),
});
const legacyAssignments = pgTable("task_assignees", {
  taskId: integer("task_id"), userId: integer("user_id"),
});

export async function loadDashboardUsers(db: ReturnType<typeof getDb>) {
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
  let assignedTasks: { assigneeId: string | number | null; [key: string]: unknown }[];
  try {
    assignedTasks = await db.select().from(tasks);
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code
      || (error as { code?: string }).code;
    if (code !== "42703") throw error;
    assignedTasks = await db.select({
      id: legacyTasks.id, title: legacyTasks.title, description: legacyTasks.description,
      status: legacyTasks.status, priority: legacyTasks.priority, dueDate: legacyTasks.dueDate,
      assigneeId: legacyAssignments.userId,
      orgId: legacyTasks.orgId,
    }).from(legacyAssignments).innerJoin(legacyTasks, eq(legacyAssignments.taskId, legacyTasks.id));
  }
  return allUsers.map((user) => {
    const userTasks = assignedTasks.filter((task) => task.assigneeId === user.id);
    return { ...user, tasks: userTasks, tasksAssigned: userTasks };
  });
}
