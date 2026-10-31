import { getDb } from "./index";
import { users } from "./schema";
import { listTasks } from "./task-store";
import { eq } from "drizzle-orm";

export async function loadDashboardUsers(
  db: ReturnType<typeof getDb>,
  userId?: string,
) {
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(userId === undefined ? undefined : eq(users.id, userId));
  const assignedTasks = await listTasks(db, { userId });
  return allUsers.map((user) => {
    const userTasks = assignedTasks.filter(
      (task) => String(task.assigneeId) === String(user.id),
    );
    return { ...user, tasks: userTasks, tasksAssigned: userTasks };
  });
}
