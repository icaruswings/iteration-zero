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
    estimate: number;
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
    {
      title: "Setup Authentication",
      description: "Implement user authentication using Clerk",
      priority: "High",
      status: "completed",
      estimate: 3,
      createdAt: formatDate(previousIterationStart),
      completedAt: formatDate(addDays(previousIterationStart, 2)),
      sprintIndex: 0,
    },
    {
      title: "Design System Implementation",
      description: "Create reusable UI components",
      priority: "Medium",
      status: "completed",
      estimate: 5,
      createdAt: formatDate(addDays(previousIterationStart, 1)),
      completedAt: formatDate(addDays(previousIterationStart, 5)),
      sprintIndex: 0,
    },
    {
      title: "Database Schema Design",
      description: "Design and implement initial database schema",
      priority: "High",
      status: "completed",
      estimate: 2,
      createdAt: formatDate(addDays(previousIterationStart, 2)),
      completedAt: formatDate(addDays(previousIterationStart, 3)),
      sprintIndex: 0,
    },
    {
      title: "Task Management Features",
      description: "Implement CRUD operations for tasks",
      priority: "Medium",
      status: "in_progress",
      estimate: 4,
      createdAt: formatDate(currentIterationStart),
      sprintIndex: 1,
    },
    {
      title: "User Profile Page",
      description: "Create user profile page with editable fields",
      priority: "Low",
      status: "completed",
      estimate: 3,
      createdAt: formatDate(addDays(previousIterationStart, 3)),
      completedAt: formatDate(addDays(previousIterationStart, 5)),
      sprintIndex: 0,
    },
    {
      title: "API Rate Limiting",
      description: "Implement rate limiting for API endpoints",
      priority: "Medium",
      status: "completed",
      estimate: 2,
      createdAt: formatDate(addDays(previousIterationStart, 4)),
      completedAt: formatDate(addDays(previousIterationStart, 5)),
      sprintIndex: 0,
    },
    {
      title: "Error Handling System",
      description: "Implement global error handling and logging",
      priority: "High",
      status: "completed",
      estimate: 3,
      createdAt: formatDate(addDays(previousIterationStart, 7)),
      completedAt: formatDate(addDays(previousIterationStart, 9)),
      sprintIndex: 0,
    },
    {
      title: "Performance Optimization",
      description: "Optimize front-end performance and loading times",
      priority: "High",
      status: "in_progress",
      estimate: 5,
      createdAt: formatDate(addDays(currentIterationStart, 1)),
      sprintIndex: 1,
    },
    {
      title: "Search Functionality",
      description: "Implement search across tasks and iterations",
      priority: "Medium",
      status: "pending",
      estimate: 4,
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Email Notifications",
      description: "Set up email notifications for task updates",
      priority: "Low",
      status: "pending",
      estimate: 3,
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Mobile Responsive Design",
      description: "Ensure all pages are mobile-friendly",
      priority: "High",
      status: "in_progress",
      estimate: 4,
      createdAt: formatDate(addDays(currentIterationStart, 2)),
      sprintIndex: 1,
    },
    {
      title: "Analytics Dashboard",
      description: "Create dashboard for tracking project metrics",
      priority: "Medium",
      status: "pending",
      estimate: 5,
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Documentation",
      description: "Write technical documentation and API guides",
      priority: "Low",
      status: "pending",
      estimate: 3,
      createdAt: formatDate(nextIterationStart),
      sprintIndex: 2,
    },
    {
      title: "Security Audit",
      description: "Perform security audit and implement fixes",
      priority: "High",
      status: "pending",
      estimate: 4,
      createdAt: formatDate(addDays(nextIterationStart, 1)),
      sprintIndex: 2,
    },
    {
      title: "Accessibility Improvements",
      description: "Implement WCAG 2.1 compliance changes",
      priority: "Medium",
      status: "pending",
      estimate: 4,
      createdAt: formatDate(addDays(nextIterationStart, 1)),
      sprintIndex: 2,
    },
    {
      title: "Burndown Chart",
      description: "Create burndown chart visualization",
      priority: "High",
      status: "in_progress",
      estimate: 3,
      createdAt: formatDate(addDays(currentIterationStart, 1)),
      sprintIndex: 1,
    },
    {
      title: "Estimation Sessions",
      description: "Implement real-time estimation sessions",
      priority: "Medium",
      status: "pending",
      estimate: 5,
      createdAt: formatDate(addDays(currentIterationStart, 1)),
      sprintIndex: 1,
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
