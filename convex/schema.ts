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
    priority: v.union(v.literal("High"), v.literal("Medium"), v.literal("Low")),
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

  estimationSessions: defineTable({
    iterationId: v.id("iterations"),
    taskId: v.optional(v.id("tasks")),
    sessionUrl: v.string(),
    status: v.union(v.literal("active"), v.literal("locked")),
    managerId: v.string(),
    createdAt: v.string(),
    participants: v.array(v.object({
      participantId: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    })),
  }).index("by_iteration", ["iterationId"]),

  estimates: defineTable({
    sessionId: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    participantId: v.string(),
    bestCase: v.number(),
    likelyCase: v.number(),
    worstCase: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_session_task", ["sessionId", "taskId"]),
});
