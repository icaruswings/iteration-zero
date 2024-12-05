import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import invariant from "tiny-invariant";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {
    id: v.id("estimationSessions"),
  },
  handler: async (ctx, { id }) => {
    const session = await ctx.db.get(id);
    invariant(session, "Session not found");

    return session;
  },
});

export const create = mutation({
  args: {
    iterationId: v.id("iterations"),
  },
  handler: async (ctx, { iterationId, }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const iteration = await ctx.db.query("iterations")
    .withIndex("by_creator", (q) => q.eq("createdBy", identity.subject))
    .filter((q) => q.eq(q.field("_id"), iterationId)).unique();

    if (!iteration) throw new Error("Iteration not found");

    const now = new Date().toISOString();

    const sessionId = await ctx.db.insert("estimationSessions", {
      iterationId: iterationId,
      currentTaskStatus: "waiting",
      createdBy: identity.subject,
      createdAt: now,
      participants: [{
        userId: identity.subject,
        name: identity.name || identity.email || "Iteration Manager",
        joinedAt: now,
      }],
    });

    const session = await ctx.db.get(sessionId);
    invariant(session, "Session not found");

    return session;
  },
});

export const joinSession = mutation({
  args: {
    id: v.id("estimationSessions"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { id, name }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    // Check if participant already exists
    const existingParticipant = session.participants.find(
      (p) => p.userId === identity.subject
    );

    if (existingParticipant) {
      return session;
    }

    // Add new participant
    await ctx.db.patch(id, {
      participants: [
        ...session.participants,
        {
          userId: identity.subject,
          name: name || identity.givenName || identity.name || identity.email || "Anonymous",
          joinedAt: new Date().toISOString(),
        }
      ],
    });

    return await ctx.db.get(id);
  },
});

export const selectTask = mutation({
  args: {
    id: v.id("estimationSessions"),
    taskId: v.union(v.id("tasks"), v.null()),
  },
  handler: async (ctx, { id, taskId }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== identity.subject) {
      throw new Error("Only the iteration manager can select tasks");
    }

    await ctx.db.patch(id, {
      currentTaskId: taskId || undefined,
      currentTaskStatus: taskId ? "active" : "waiting",
    });
  },
});

export const submitEstimates = mutation({
  args: {
    id: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    estimate: v.number(),
  },
  handler: async (ctx, { id, taskId, estimate }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.currentTaskStatus !== "active") {
      throw new Error("Session is not active");
    }

    if (session.currentTaskId !== taskId) {
      throw new Error("Task is not currently being estimated");
    }

    // Check if user has already submitted an estimate
    const existingEstimate = await ctx.db
      .query("estimates")
      .withIndex("by_session_task", (q) =>
        q.eq("sessionId", id).eq("taskId", taskId)
      )
      .filter((q) => q.eq(q.field("participantId"), identity.subject))
      .unique();

    if (existingEstimate) {
      // Update existing estimate
      await ctx.db.patch(existingEstimate._id, {
        estimate,
      });
    } else {
      // Create new estimate
      await ctx.db.insert("estimates", {
        sessionId: id,
        taskId,
        participantId: identity.subject,
        estimate,
        createdAt: new Date().toISOString(),
      });
    }

    return session;
  },
});

export const saveFinalEstimates = mutation({
  args: {
    id: v.id("estimationSessions"),
    taskId: v.id("tasks"),
    estimate: v.number(),
  },
  handler: async (ctx, { id, taskId, estimate }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== identity.subject) {
      throw new Error("Only the session creator can save final estimates");
    }

    const task = await ctx.db.get(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    // Update task with final estimate
    await ctx.db.patch(taskId, {
      estimate,
    });

    return task;
  },
});

export const lockEstimates = mutation({
  args: {
    id: v.id("estimationSessions"),
  },
  handler: async (ctx, { id }) => { 
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== identity.subject) {
      throw new Error("Only the session manager can lock estimates");
    }

    // Lock the estimates for the current task
    return await ctx.db.patch(id, {
      currentTaskStatus: "locked",
    });
  },
});

export const unlockEstimates = mutation({
  args: {
    id: v.id("estimationSessions"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== identity.subject) {
      throw new Error("Only the session manager can lock estimates");
    }

    await ctx.db.patch(id, {
      currentTaskStatus: "active",
    });
  },
});

export const getEstimates = query({
  args: { 
    id: v.id("estimationSessions"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { id, taskId }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(id);

    if (!session) {
      throw new Error("Session not found");
    }

    // if (session.createdBy !== identity.subject) {
    //   throw new Error("Only the session manager can retrieve estimates");
    // }

    return await ctx.db
      .query("estimates")
      .withIndex("by_session_task", (q) => 
        q.eq("sessionId", id).eq("taskId", taskId)
      )
      .collect();
  },
});

export const getAllTaskEstimates = query({
  args: { 
    iterationId: v.id("iterations"),
  },
  handler: async (ctx, { iterationId }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Get all estimation sessions for this iteration
    const sessions = await ctx.db
      .query("estimationSessions")
      .withIndex("by_iteration", (q) => q.eq("iterationId", iterationId))
      .collect();

    if (sessions.length === 0) {
      return [];
    }

    // Get all tasks for this iteration to build a map of final estimates
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_iteration", (q) => q.eq("iterationId", iterationId))
      .collect();

    const taskMap = new Map(tasks.map(task => [task._id, task]));
    const estimates = [];

    // For each session, get its estimates
    for (const session of sessions) {
      if (!session.currentTaskId) continue;
      
      const sessionEstimates = await ctx.db
        .query("estimates")
        .withIndex("by_session_task", (q) => 
          q.eq("sessionId", session._id)
            .eq("taskId", session.currentTaskId as Id<"tasks">)
        )
        .collect();

      if (sessionEstimates.length > 0) {
        // Calculate average estimate for this task
        const sum = sessionEstimates.reduce((acc, curr) => acc + curr.estimate, 0);
        const average = Math.round(sum / sessionEstimates.length * 10) / 10
        const task = taskMap.get(session.currentTaskId);
        
        if (task) {
          estimates.push({
            taskId: session.currentTaskId,
            taskTitle: task.title,
            estimate: average
          });
        }
      }
    }

    return estimates;
  },
});
