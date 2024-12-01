import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { nanoid } from "nanoid";
import invariant from "tiny-invariant";

export const create = mutation({
  args: {
    iterationId: v.id("iterations"),
    managerId: v.string(),
    managerName: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionUrl = nanoid(10); // Generate a short unique URL
    const now = new Date().toISOString();

    const sessionId = await ctx.db.insert("estimationSessions", {
      iterationId: args.iterationId,
      sessionUrl,
      status: "active",
      managerId: args.managerId,
      createdAt: now,
      participants: [{
        participantId: args.managerId,
        name: args.managerName,
      }],
    });

    const session = await ctx.db.get(sessionId);

    invariant(session, "Session not found");

    return session;
  },
});

export const join = mutation({
  args: {
    sessionUrl: v.string(),
    participantId: v.string(),
    participantName: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("estimationSessions")
      .filter((q) => q.eq(q.field("sessionUrl"), args.sessionUrl))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status === "locked") {
      throw new Error("Session is locked");
    }

    // Check if participant already exists
    const existingParticipant = session.participants.find(
      (p) => p.participantId === args.participantId
    );
    if (existingParticipant) {
      return session;
    }

    // Add new participant
    const updatedSession = await ctx.db.patch(session._id, {
      participants: [...session.participants, {
        participantId: args.participantId,
        name: args.participantName,
      }],
    });

    return updatedSession;
  },
});

export const selectTask = mutation({
  args: {
    sessionId: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    managerId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.managerId !== args.managerId) {
      throw new Error("Only the session manager can select tasks");
    }

    return await ctx.db.patch(args.sessionId, {
      taskId: args.taskId,
    });
  },
});

export const submitEstimate = mutation({
  args: {
    sessionId: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    participantId: v.string(),
    bestCase: v.number(),
    likelyCase: v.number(),
    worstCase: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status === "locked") {
      throw new Error("Session is locked");
    }

    const now = new Date().toISOString();
    const existingEstimate = await ctx.db
      .query("estimates")
      .filter((q) => 
        q.and(
          q.eq(q.field("sessionId"), args.sessionId),
          q.eq(q.field("taskId"), args.taskId),
          q.eq(q.field("participantId"), args.participantId)
        )
      )
      .first();

    if (existingEstimate) {
      return await ctx.db.patch(existingEstimate._id, {
        bestCase: args.bestCase,
        likelyCase: args.likelyCase,
        worstCase: args.worstCase,
        updatedAt: now,
      });
    }

    return await ctx.db.insert("estimates", {
      sessionId: args.sessionId,
      taskId: args.taskId,
      participantId: args.participantId,
      bestCase: args.bestCase,
      likelyCase: args.likelyCase,
      worstCase: args.worstCase,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const lockEstimates = mutation({
  args: {
    sessionId: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    managerId: v.string(),
    bestCase: v.number(),
    likelyCase: v.number(),
    worstCase: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.managerId !== args.managerId) {
      throw new Error("Only the session manager can lock estimates");
    }

    // Update task with final estimates
    await ctx.db.patch(args.taskId, {
      bestCaseEstimate: args.bestCase,
      likelyCaseEstimate: args.likelyCase,
      worstCaseEstimate: args.worstCase,
    });

    // Lock the session
    return await ctx.db.patch(args.sessionId, {
      status: "locked",
    });
  },
});

export const getByUrl = query({
  args: { sessionUrl: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("estimationSessions")
      .filter((q) => q.eq(q.field("sessionUrl"), args.sessionUrl))
      .first();
  },
});

export const getEstimates = query({
  args: { 
    sessionId: v.id("estimationSessions"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("estimates")
      .filter((q) => 
        q.and(
          q.eq(q.field("sessionId"), args.sessionId),
          q.eq(q.field("taskId"), args.taskId)
        )
      )
      .collect();
  },
});
