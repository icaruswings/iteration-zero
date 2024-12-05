import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  iterations: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(),
    description: v.string(),
    createdAt: v.string(),
    createdBy: v.string(), // Clerk user ID
  }).index("by_creator", ["createdBy"]),

  tasks: defineTable({
    iterationId: v.id("iterations"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    priority: v.union(v.literal("High"), v.literal("Medium"), v.literal("Low")),
    estimate: v.optional(v.number()),
    createdAt: v.string(),
    createdBy: v.string(), // Clerk user ID
    completedAt: v.optional(v.string()),
  }).index("by_iteration", ["iterationId"]),

  estimationSessions: defineTable({
    iterationId: v.id("iterations"),
    currentTaskId: v.optional(v.id("tasks")), // current task being estimated
    currentTaskStatus: v.union(v.literal("waiting"), v.literal("active"), v.literal("locked")),
    createdBy: v.string(), // Clerk user ID
    createdAt: v.string(),
    participants: v.array(v.object({
      userId: v.string(), // Clerk user ID
      name: v.string(),
      joinedAt: v.string(),
    })),
  }).index("by_iteration", ["iterationId"]),

  estimates: defineTable({
    sessionId: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    participantId: v.string(), // Clerk user ID
    estimate: v.number(),
    createdAt: v.string(),
  }).index("by_task", ["taskId"])
  .index("by_session_task", ["sessionId", "taskId"])
});
