import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.string(),
    goals: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const iteration = await ctx.db.insert("iterations", {
      ...args,
      status: "active",
    });
    return iteration;
  },
});

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("iterations");
    
    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await q.collect();
  },
});

export const getById = query({
  args: { id: v.id("iterations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const get = query({
  args: { id: v.id("iterations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("iterations"),
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.string(),
    goals: v.array(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const iteration = await ctx.db.get(id);
    
    if (!iteration) {
      throw new Error("Iteration not found");
    }

    return await ctx.db.patch(id, updates);
  },
});
