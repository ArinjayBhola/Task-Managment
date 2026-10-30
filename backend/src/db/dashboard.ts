import { getDb } from "./index";
import { users } from "./schema";
import { listTasks } from "./task-store";

export async function loadDashboardUsers(db: ReturnType<typeof getDb>) {
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users);
  const assignedTasks = await listTasks(db);
  return allUsers.map((user) => {
    const userTasks = assignedTasks.filter(
      (task) => String(task.assigneeId) === String(user.id),
    );
    return { ...user, tasks: userTasks, tasksAssigned: userTasks };
  });
}
