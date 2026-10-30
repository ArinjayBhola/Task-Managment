import { sql } from "drizzle-orm";
import { getDb } from "./index";

type Database = ReturnType<typeof getDb>;
export type Actor = { id: string | number; role: "Admin" | "User" };
type TaskRow = Record<string, unknown> & {
  id: string | number;
  assigneeId: string | number | null;
  adminComments: string;
  memberComments: string;
};

async function isLegacy(db: Database) {
  const {
    rows: [layout],
  } = await db.execute(sql`
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'organization_id') AS legacy
  `);
  return !!layout.legacy;
}

export function displayStatus(status: unknown) {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
  if (["done", "completed"].includes(normalized)) return "Completed";
  if (["in-progress", "in progress"].includes(normalized)) return "In Progress";
  if (["canceled", "cancelled"].includes(normalized)) return "Canceled";
  return "Not Started";
}

function storageStatus(status: string) {
  const display = displayStatus(status);
  return display === "Completed"
    ? "done"
    : display === "In Progress"
      ? "in-progress"
      : display === "Canceled"
        ? "canceled"
        : "todo";
}

export async function listTasks(
  db: Database,
  options: { taskId?: string; userId?: string | number } = {},
) {
  const legacy = await isLegacy(db);
  const join = legacy
    ? sql`LEFT JOIN task_assignees a ON a.task_id = t.id LEFT JOIN users u ON u.id = a.user_id`
    : sql`LEFT JOIN users u ON u.id = t.assignee_id`;
  const { rows } = await db.execute(sql`
    SELECT t.id, t.title, t.description, t.status, t.priority,
      t.due_date AS "dueDate", t.created_at AS "createdAt", t.updated_at AS "updatedAt",
      t.admin_notes AS "adminComments", t.member_notes AS "memberComments",
      u.id AS "assigneeId", u.name AS "assigneeName", u.email AS "assigneeEmail"
    FROM tasks t ${join}
    WHERE ${options.taskId ? sql`t.id::text = ${options.taskId}` : sql`TRUE`}
      AND ${options.userId !== undefined ? sql`u.id::text = ${String(options.userId)}` : sql`TRUE`}
    ORDER BY t.updated_at DESC, t.id DESC
  `);
  return (rows as TaskRow[]).map((task) => ({
    ...task,
    status: displayStatus(task.status),
  }));
}

export async function taskDetail(db: Database, taskId: string, actor: Actor) {
  const [task] = await listTasks(db, {
    taskId,
    ...(actor.role === "User" ? { userId: actor.id } : {}),
  });
  if (!task) return null;
  return {
    ...task,
    comments: actor.role === "Admin" ? task.adminComments : task.memberComments,
    user: {
      id: task.assigneeId,
      name: task.assigneeName,
      email: task.assigneeEmail,
    },
  };
}

export async function createTask(
  db: Database,
  actor: Actor,
  input: {
    assigneeId: string;
    description: string;
    dueDate: string;
    status: string;
    comments: string;
  },
) {
  const legacy = await isLegacy(db);
  const columns = legacy ? sql`` : sql`, assignee_id`;
  const assignee = legacy ? sql`` : sql`, u.id`;
  const assignment = legacy
    ? sql`, assignment AS (
    INSERT INTO task_assignees (task_id, user_id)
    SELECT new_task.id, u.id FROM new_task CROSS JOIN users u WHERE u.id::text = ${input.assigneeId}
    RETURNING task_id
  )`
    : sql``;
  const {
    rows: [created],
  } = await db.execute(sql`
    WITH new_task AS (
      INSERT INTO tasks (title, description, status, due_date, admin_notes, assigned_admin_id ${columns})
      SELECT ${input.description.slice(0, 120)}, ${input.description}, ${storageStatus(input.status)},
        ${input.dueDate}::timestamp, ${input.comments}, ${String(actor.id)}::uuid ${assignee}
      FROM users u WHERE u.id::text = ${input.assigneeId}
      RETURNING id
    ) ${assignment}
    SELECT id FROM new_task
  `);
  return created ? taskDetail(db, String(created.id), actor) : null;
}

export async function updateTask(
  db: Database,
  actor: Actor,
  taskId: string,
  changes: {
    status?: string;
    comments?: string;
    description?: string;
    dueDate?: string;
  },
) {
  const legacy = await isLegacy(db);
  const assignments = [];
  if (actor.role === "Admin" && changes.description !== undefined) {
    assignments.push(
      sql`description = ${changes.description}`,
      sql`title = ${changes.description.slice(0, 120)}`,
    );
  }
  if (actor.role === "Admin" && changes.dueDate !== undefined)
    assignments.push(sql`due_date = ${changes.dueDate}::timestamp`);
  if (changes.status !== undefined)
    assignments.push(sql`status = ${storageStatus(changes.status)}`);
  if (changes.comments !== undefined)
    assignments.push(
      actor.role === "Admin"
        ? sql`admin_notes = ${changes.comments}`
        : sql`member_notes = ${changes.comments}`,
    );
  assignments.push(sql`updated_at = now()`);
  const permission =
    actor.role === "Admin"
      ? sql`TRUE`
      : legacy
        ? sql`EXISTS (SELECT 1 FROM task_assignees a WHERE a.task_id = t.id AND a.user_id::text = ${String(actor.id)})`
        : sql`t.assignee_id::text = ${String(actor.id)}`;
  const {
    rows: [updated],
  } = await db.execute(sql`
    UPDATE tasks t SET ${sql.join(assignments, sql`, `)}
    WHERE t.id::text = ${taskId} AND ${permission} RETURNING t.id
  `);
  return updated ? taskDetail(db, taskId, actor) : null;
}

export async function deleteTask(db: Database, taskId: string) {
  const legacy = await isLegacy(db);
  // The existing integer-ID database cascades task children. The newer schema
  // needs its comments and activity records removed in the same statement.
  const children = legacy
    ? sql``
    : sql`WITH removed_comments AS (
    DELETE FROM comments WHERE task_id::text = ${taskId}
  ), removed_activity AS (DELETE FROM activity_logs WHERE task_id::text = ${taskId})`;
  const { rows } = await db.execute(
    sql`${children} DELETE FROM tasks WHERE id::text = ${taskId} RETURNING id`,
  );
  return rows.length > 0;
}
