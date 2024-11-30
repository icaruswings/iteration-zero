import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    iterationId: v.id("iterations"),
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    assignee: v.optional(v.string()),
    bestCaseEstimate: v.number(),
    likelyCaseEstimate: v.number(),
    worstCaseEstimate: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.insert("tasks", {
      ...args,
      status: "todo",
    });
    return task;
  },
});

export const listByIteration = query({
  args: { iterationId: v.id("iterations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("iterationId"), args.iterationId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignee: v.optional(v.string()),
    bestCaseEstimate: v.optional(v.number()),
    likelyCaseEstimate: v.optional(v.number()),
    worstCaseEstimate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const task = await ctx.db.patch(id, {
      ...fields,
    });
    return task;
  },
});
