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
  handler: async (ctx) => {
    return await ctx.db.query("iterations").collect();
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
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const iteration = await ctx.db.patch(id, {
      ...fields,
    });
    return iteration;
  },
});
