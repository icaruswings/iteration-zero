import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
    const now = new Date().toISOString();
    const task = await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
      statusHistory: [{
        status: "pending",
        timestamp: now,
      }],
      createdAt: now,
      completedAt: undefined,
    });
    return task;
  },
});

export const listByIteration = query({
  args: { iterationId: v.id("iterations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_iteration", (q) => q.eq("iterationId", args.iterationId))
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const { id, status } = args;
    const now = new Date().toISOString();
    
    const task = await ctx.db.get(id);
    if (!task) throw new Error("Task not found");

    const currentHistory = task.statusHistory ?? [];
    const newHistory = [...currentHistory, { status, timestamp: now }];

    const updatedTask = await ctx.db.patch(id, {
      status,
      statusHistory: newHistory,
      completedAt: status === "completed" ? now : undefined,
    });
    return updatedTask;
  },
});
