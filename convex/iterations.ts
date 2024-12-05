import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("iterations") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const iteration = await ctx.db.query("iterations")
    .withIndex("by_creator", (q) => q.eq("createdBy", identity.subject))
    .filter((q) => q.eq(q.field("_id"), id)).first();

    if (!iteration) throw new Error("Iteration not found");

    return iteration;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = new Date().toISOString();

    const iteration = await ctx.db.insert("iterations", {
      ...args,
      status: "active",
      createdAt: now,
      createdBy: identity.subject,
    });

    return iteration;
  },
});

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const iterations = await ctx.db.query("iterations")
      .withIndex("by_creator", (q) => q.eq("createdBy", identity.subject))
      .collect();

    return iterations;
  },
});

export const update = mutation({
  args: {
    id: v.id("iterations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const iteration = await ctx.db.query("iterations")
    .withIndex("by_creator", (q) => q.eq("createdBy", identity.subject))
    .filter((q) => q.eq(q.field("_id"), id)).first();

    if (!iteration) throw new Error("Iteration not found");

    await ctx.db.patch(id, fields);
    return;
  },
});
