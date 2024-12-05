import { v } from "convex/values";
import { mutation } from "./_generated/server";

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

const seedData: SeedData = {
  iterations: [
    {
      name: "Sprint 1",
      startDate: "2024-01-01",
      endDate: "2024-01-14",
      description: "Initial sprint focusing on core features",
      status: "completed",
      createdAt: "2024-01-01",
    },
    {
      name: "Sprint 2",
      startDate: "2024-01-15",
      endDate: "2024-01-28",
      description: "Implementing user feedback and bug fixes",
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      name: "Sprint 3",
      startDate: "2024-01-29",
      endDate: "2024-02-11",
      description: "New feature development sprint",
      status: "pending",
      createdAt: "2024-01-29",
    },
  ],
  tasks: [
    {
      title: "Setup Authentication",
      description: "Implement user authentication using Clerk",
      priority: "High",
      status: "completed",
      estimate: 3,
      createdAt: "2024-01-01",
      completedAt: "2024-01-03",
      sprintIndex: 0,
    },
    {
      title: "Design System Implementation",
      description: "Create reusable UI components",
      priority: "Medium",
      status: "completed",
      estimate: 5,
      createdAt: "2024-01-02",
      completedAt: "2024-01-06",
      sprintIndex: 0,
    },
    {
      title: "Database Schema Design",
      description: "Design and implement initial database schema",
      priority: "High",
      status: "completed",
      estimate: 2,
      createdAt: "2024-01-03",
      completedAt: "2024-01-04",
      sprintIndex: 0,
    },
    {
      title: "Task Management Features",
      description: "Implement CRUD operations for tasks",
      priority: "Medium",
      status: "in_progress",
      estimate: 4,
      createdAt: "2024-01-15",
      sprintIndex: 1,
    },
    {
      title: "User Profile Page",
      description: "Create user profile page with editable fields",
      priority: "Low",
      status: "completed",
      estimate: 3,
      createdAt: "2024-01-04",
      completedAt: "2024-01-06",
      sprintIndex: 0,
    },
    {
      title: "API Rate Limiting",
      description: "Implement rate limiting for API endpoints",
      priority: "High",
      status: "completed",
      estimate: 2,
      createdAt: "2024-01-05",
      completedAt: "2024-01-06",
      sprintIndex: 0,
    },
    {
      title: "Error Handling System",
      description: "Implement global error handling and logging",
      priority: "High",
      status: "completed",
      estimate: 3,
      createdAt: "2024-01-08",
      completedAt: "2024-01-10",
      sprintIndex: 0,
    },
    {
      title: "Performance Optimization",
      description: "Optimize front-end performance and loading times",
      priority: "Medium",
      status: "in_progress",
      estimate: 5,
      createdAt: "2024-01-16",
      sprintIndex: 1,
    },
    {
      title: "Search Functionality",
      description: "Implement search across tasks and iterations",
      priority: "Medium",
      status: "pending",
      estimate: 4,
      createdAt: "2024-01-29",
      sprintIndex: 2,
    },
    {
      title: "Email Notifications",
      description: "Set up email notifications for task updates",
      priority: "Low",
      status: "pending",
      estimate: 3,
      createdAt: "2024-01-29",
      sprintIndex: 2,
    },
    {
      title: "Mobile Responsive Design",
      description: "Ensure all pages are mobile-friendly",
      priority: "High",
      status: "in_progress",
      estimate: 4,
      createdAt: "2024-01-17",
      sprintIndex: 1,
    },
    {
      title: "Analytics Dashboard",
      description: "Create dashboard for tracking project metrics",
      priority: "Medium",
      status: "pending",
      estimate: 5,
      createdAt: "2024-01-29",
      sprintIndex: 2,
    },
    {
      title: "Documentation",
      description: "Write technical documentation and API guides",
      priority: "Low",
      status: "pending",
      estimate: 3,
      createdAt: "2024-01-29",
      sprintIndex: 2,
    },
    {
      title: "Security Audit",
      description: "Perform security audit and implement fixes",
      priority: "High",
      status: "pending",
      estimate: 4,
      createdAt: "2024-01-30",
      sprintIndex: 2,
    },
    {
      title: "Accessibility Improvements",
      description: "Implement WCAG 2.1 compliance changes",
      priority: "Medium",
      status: "pending",
      estimate: 4,
      createdAt: "2024-01-30",
      sprintIndex: 2,
    },
    {
      title: "Burndown Chart",
      description: "Create burndown chart visualization",
      priority: "Medium",
      status: "in_progress",
      estimate: 3,
      createdAt: "2024-01-16",
      sprintIndex: 1,
    },
    {
      title: "Estimation Sessions",
      description: "Implement real-time estimation sessions",
      priority: "High",
      status: "pending",
      estimate: 5,
      createdAt: "2024-01-16",
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
