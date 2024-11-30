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
    status: v.string(),
    assignee: v.optional(v.string()),
    priority: v.string(),
    bestCaseEstimate: v.number(), // in days
    likelyCaseEstimate: v.number(), // in days
    worstCaseEstimate: v.number(), // in days
  }),
});
