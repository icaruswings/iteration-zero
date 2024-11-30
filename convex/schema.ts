import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  iterations: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(),
    goals: v.array(v.string()),
    description: v.string(),
  }),

  tasks: defineTable({
    iterationId: v.id("iterations"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    assignee: v.optional(v.string()),
    priority: v.string(),
    bestCaseEstimate: v.number(), // in days
    likelyCaseEstimate: v.number(), // in days
    worstCaseEstimate: v.number(), // in days
    statusHistory: v.optional(v.array(v.object({
      status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
      timestamp: v.string(),
    }))),
    createdAt: v.optional(v.string()),
    completedAt: v.optional(v.string()), // Date when task was marked as completed
  }).index("by_iteration", ["iterationId"]),
});
