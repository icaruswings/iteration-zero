import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { isMonday, previousMonday, addDays, subDays, addWeeks, format } from "date-fns";

type SeedData = {
  iterations: {
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    status: string;
    createdAt: string;
  }[];
  tasks: {
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
    status: "pending" | "in_progress" | "completed";
    estimate: "SM" | "MD" | "LG" | "XLG";
    createdAt: string;
    completedAt?: string;
    sprintIndex: number;
  }[];
};

// Get the start date of the current iteration (previous Monday)
const currentIterationStart = previousMonday(new Date());
const currentIterationEnd = addDays(currentIterationStart, 13); // 2 weeks - 1 day

// Calculate previous iteration dates
const previousIterationStart = subDays(currentIterationStart, 14);
const previousIterationEnd = subDays(currentIterationStart, 1);

// Calculate next iteration dates
const nextIterationStart = addDays(currentIterationEnd, 1);
const nextIterationEnd = addDays(nextIterationStart, 13);

// Format dates to ISO string (YYYY-MM-DD)
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const seedData: SeedData = {
  iterations: [
    {
      name: "Previous Sprint",
      startDate: formatDate(previousIterationStart),
      endDate: formatDate(previousIterationEnd),
      description: "Initial sprint focusing on core features",
      status: "completed",
      createdAt: formatDate(previousIterationStart),
    },
    {
      name: "Current Sprint",
      startDate: formatDate(currentIterationStart),
      endDate: formatDate(currentIterationEnd),
      description: "Implementing user feedback and bug fixes",
      status: "active",
      createdAt: formatDate(currentIterationStart),
    },
    {
      name: "Next Sprint",
      startDate: formatDate(nextIterationStart),
      endDate: formatDate(nextIterationEnd),
      description: "New feature development sprint",
      status: "pending",
      createdAt: formatDate(nextIterationStart),
    },
  ],
  tasks: [
    // Previous Sprint Tasks (completed)
    {
      title: "Setup Authentication",
      description: "Implement user authentication using Clerk",
      priority: "High",
      status: "completed",
      estimate: "MD", // 2-5 days
      createdAt: formatDate(previousIterationStart),
      completedAt: formatDate(addDays(previousIterationStart, 3)), // Took 3 days
      sprintIndex: 0,
    },
    {
      title: "Design System Implementation",
      description: "Create reusable UI components",
      priority: "Medium",
      status: "completed",
      estimate: "LG", // 3-8 days
      createdAt: formatDate(previousIterationStart),
      completedAt: formatDate(addDays(previousIterationStart, 6)), // Took 6 days
      sprintIndex: 0,
    },
    {
      title: "Database Schema Design",
      description: "Design and implement initial database schema",
      priority: "High",
      status: "completed",
      estimate: "LG", // 3-8 days
      createdAt: formatDate(addDays(previousIterationStart, 2)),
      completedAt: formatDate(addDays(previousIterationStart, 7)), // Took 5 days
      sprintIndex: 0,
    },
    {
      title: "User Profile Page",
      description: "Create user profile page with editable fields",
      priority: "Low",
      status: "completed",
      estimate: "SM", // 1-3 days
      createdAt: formatDate(addDays(previousIterationStart, 7)),
      completedAt: formatDate(addDays(previousIterationStart, 9)), // Took 2 days
      sprintIndex: 0,
    },
    {
      title: "API Rate Limiting",
      description: "Implement rate limiting for API endpoints",
      priority: "Medium",
      status: "completed",
      estimate: "MD", // 2-5 days
      createdAt: formatDate(addDays(previousIterationStart, 9)),
      completedAt: formatDate(addDays(previousIterationStart, 12)), // Took 3 days
      sprintIndex: 0,
    },

    // Current Sprint Tasks
    {
      title: "Task Management Features",
      description: "Implement CRUD operations for tasks",
      priority: "High",
      status: "in_progress",
      estimate: "XLG", // 5-13 days
      createdAt: formatDate(currentIterationStart),
      sprintIndex: 1,
    },
    {
      title: "Performance Optimization",
      description: "Optimize front-end performance and loading times",
      priority: "High",
      status: "in_progress",
      estimate: "LG", // 3-8 days
      createdAt: formatDate(currentIterationStart),
      sprintIndex: 1,
    },
    {
      title: "Mobile Responsive Design",
      description: "Ensure all pages are mobile-friendly",
      priority: "Medium",
      status: "pending",
      estimate: "MD", // 2-5 days
      createdAt: formatDate(currentIterationStart),
      sprintIndex: 1,
    },
    {
      title: "Error Handling System",
      description: "Implement global error handling and logging",
      priority: "High",
      status: "pending",
      estimate: "MD", // 2-5 days
      createdAt: formatDate(currentIterationStart),
      sprintIndex: 1,
    },

    // Next Sprint Tasks
    {
      title: "Search Functionality",
      description: "Implement search across tasks and iterations",
      priority: "Medium",
      status: "pending",
      estimate: "LG", // 3-8 days
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Email Notifications",
      description: "Set up email notifications for task updates",
      priority: "Low",
      status: "pending",
      estimate: "SM", // 1-3 days
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Analytics Dashboard",
      description: "Create dashboard for tracking project metrics",
      priority: "Medium",
      status: "pending",
      estimate: "XLG", // 5-13 days
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Documentation",
      description: "Write technical documentation and API guides",
      priority: "Low",
      status: "pending",
      estimate: "MD", // 2-5 days
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Security Audit",
      description: "Perform security audit and implement fixes",
      priority: "High",
      status: "pending",
      estimate: "LG", // 3-8 days
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
  ],
};

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const iterationIds = await Promise.all(
      seedData.iterations.map(async (iteration) => {
        return await ctx.db.insert("iterations", {
          ...iteration,
          createdBy: userId,
        });
      })
    );

    // Create tasks and associate them with iterations
    await Promise.all(
      seedData.tasks.map(async (task) => {
        const { sprintIndex, ...taskData } = task;
        return await ctx.db.insert("tasks", {
          ...taskData,
          createdBy: userId,
          iterationId: iterationIds[sprintIndex],
        });
      })
    );

    return {
      success: true,
      message: "Seed data loaded successfully",
    };
  },
});
