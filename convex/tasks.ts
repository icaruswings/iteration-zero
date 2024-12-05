import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    iterationId: v.id("iterations"),
    id: v.id("tasks"),
  },
  handler: async (ctx, { iterationId, id }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    // .withIndex("by_creator", (q) => q.eq("createdBy", identity.subject))
    const iteration = await ctx.db.query("iterations")
    .filter((q) => q.eq(q.field("_id"), iterationId)).unique();

    if (!iteration) throw new Error("Iteration not found");

    return await ctx.db.query("tasks")
    .withIndex("by_iteration", (q) => q.eq("iterationId", iterationId))
    .filter((q) => q.eq(q.field("_id"), id)).unique();
  },
});

export const create = mutation({
  args: {
    iterationId: v.id("iterations"),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("High"), v.literal("Medium"), v.literal("Low")),
    estimate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = new Date().toISOString();

    const task = await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
      createdAt: now,
      createdBy: identity.subject,
    });
    return task;
  },
});

export const list = query({
  args: {
    iterationId: v.id("iterations")
  },
  handler: async (ctx, { iterationId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_iteration", (q) => q.eq("iterationId", iterationId))
      .collect();
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 5 }) => {
    return await ctx.db
      .query("tasks")
      .order("desc")
      .take(limit);
  },
});

export const updateStatus = mutation({
  args: {
    iterationId: v.id("iterations"),
    id: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: async (ctx, { iterationId, id, status }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const iteration = await ctx.db.query("iterations")
    .withIndex("by_creator", (q) => q.eq("createdBy", identity.subject))
    .filter((q) => q.eq(q.field("_id"), iterationId)).unique();

    if (!iteration) throw new Error("Iteration not found");

    const task = await ctx.db.get(id);
    if (!task) throw new Error("Task not found");

    const now = new Date().toISOString();

    await ctx.db.patch(id, {
      status,
      // Set completedAt to current time when completed, null when not completed
      completedAt: status === "completed" ? now : null,
    });

    return;
  },
});
