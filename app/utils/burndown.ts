import { Doc } from "../../convex/_generated/dataModel";

type Task = Doc<"tasks">;

enum BurndownStatus {
  Ahead = "ahead",
  AtRisk = "at-risk",
  Behind = "behind",
}

export function calculateBurndownProgress(
  startDate: string,
  endDate: string,
  tasks: Task[]
) {
  const now = Date.now();
  
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const totalDuration = end - start;

  const elapsed = Math.max(0, now - start);
  const timeProgress = Math.min(Math.max(0.001, elapsed / totalDuration), 1);

  console.log(startDate, endDate)

  const totalEffort = tasks.reduce((sum, task) => sum + (task.estimate || 0), 0);
  const remainingEffort = tasks
    .filter(task => task.status !== "completed")
    .reduce((sum, task) => sum + (task.estimate || 0), 0);
  
  const effortProgress = totalEffort === 0 ? 1 : (totalEffort - remainingEffort) / totalEffort;
  
  // Compare effort progress to time progress to determine status
  const burndownRatio = effortProgress / timeProgress;
  
  return {
    progress: Math.round(timeProgress * 100),
    status: burndownRatio >= 0.9 ? BurndownStatus.Ahead : 
           burndownRatio >= 0.4 ? BurndownStatus.Behind :
           BurndownStatus.AtRisk
  };
}
