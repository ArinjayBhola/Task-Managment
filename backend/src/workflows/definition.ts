import { z } from "zod";
const common = {
  key: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  title: z.string().trim().min(1).max(120),
  dependencies: z.array(z.string()).max(40).default([]),
  join: z.enum(["all", "any"]).default("all"),
  when: z.object({ nodeKey: z.string(), outcome: z.boolean() }).optional(),
  position: z
    .object({ x: z.number().min(0).max(4000), y: z.number().min(0).max(4000) })
    .optional(),
};
export const definitionSchema = z
  .object({
    nodes: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            ...common,
            type: z.literal("task"),
            description: z.string().max(10000).default(""),
            assigneeId: z.string().uuid(),
            dueDays: z.number().int().min(1).max(365),
            requiresApproval: z.boolean().default(true),
          }),
          z.object({
            ...common,
            type: z.literal("delay"),
            waitHours: z.number().min(0.01).max(8760),
          }),
          z.object({
            ...common,
            type: z.literal("condition"),
            sourceKey: z.string(),
            operator: z.enum(["contains", "not_contains"]),
            keyword: z.string().trim().min(1).max(200),
          }),
        ]),
      )
      .min(1)
      .max(40),
  })
  .superRefine(({ nodes }, ctx) => {
    const keys = new Set(nodes.map((node) => node.key));
    const report = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (keys.size !== nodes.length) report("Each step needs a unique key.");
    if (!nodes.some((node) => node.type === "task"))
      report("Add at least one task.");
    for (const node of nodes) {
      if (
        node.type === "condition" &&
        (!node.dependencies.includes(node.sourceKey) ||
          nodes.find((item) => item.key === node.sourceKey)?.type !== "task")
      )
        report(
          "A condition must depend on the task whose submission it reads.",
        );
      if (
        node.when &&
        (!node.dependencies.includes(node.when.nodeKey) ||
          nodes.find((item) => item.key === node.when?.nodeKey)?.type !==
            "condition")
      )
        report("A branch must depend on its condition step.");
      if (new Set(node.dependencies).size !== node.dependencies.length)
        report("Duplicate dependencies are not allowed.");
      for (const dependency of node.dependencies)
        if (!keys.has(dependency) || dependency === node.key)
          report("Dependencies must reference another existing step.");
    }
    const visited = new Set<string>(),
      visiting = new Set<string>();
    const visit = (key: string): boolean => {
      if (visiting.has(key)) return false;
      if (visited.has(key)) return true;
      visiting.add(key);
      for (const dep of nodes.find((node) => node.key === key)?.dependencies ||
        [])
        if (!visit(dep)) return false;
      visiting.delete(key);
      visited.add(key);
      return true;
    };
    if (nodes.some((node) => !visit(node.key)))
      report("Circular dependencies are not allowed.");
  });
export const publishSchema = z.object({
  name: z.string().trim().min(1).max(120),
  definition: definitionSchema,
});
