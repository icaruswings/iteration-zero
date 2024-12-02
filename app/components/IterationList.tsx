import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@remix-run/react";
import { Id } from "../../convex/_generated/dataModel";

interface Iteration {
  _id: Id<"iterations">;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
}

interface Task {
  _id: Id<"tasks">;
  iterationId: Id<"iterations">;
  status: string;
  worstCaseEstimate: number;
  statusHistory?: { status: "completed" | "pending" | "in_progress"; timestamp: string; }[];
}

interface IterationListProps {
  iterations: Iteration[];
}

function calculateBurndownProgress(
  startDate: string,
  endDate: string,
  tasks: Task[]
) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const totalDuration = end - start;
  const elapsed = now - start;
  const timeProgress = Math.min(Math.max(0, elapsed / totalDuration), 1);

  const totalEffort = tasks.reduce((sum, task) => sum + task.worstCaseEstimate, 0);
  const remainingEffort = tasks
    .filter(task => task.status !== "completed")
    .reduce((sum, task) => sum + task.worstCaseEstimate, 0);
  
  const effortProgress = totalEffort === 0 ? 1 : (totalEffort - remainingEffort) / totalEffort;
  
  // If we're burning down effort faster than time is passing, we're ahead (green)
  // If we're burning down effort at roughly the same rate as time, we're on track (blue)
  // If we're burning down effort slower than time is passing, we're behind (yellow/red)
  const burndownRatio = effortProgress / timeProgress;
  
  return {
    progress: Math.round(effortProgress * 100),
    status: burndownRatio >= 1.1 ? "ahead" : 
           burndownRatio >= 0.9 ? "on-track" :
           burndownRatio >= 0.7 ? "behind" : "at-risk"
  };
}

export default function IterationList({ iterations }: { iterations: Iteration[] | undefined }) {
  const allTasks: Task[] = useQuery(api.tasks.listRecent) ?? [];
  
  if (!iterations) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="block rounded-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden"
          >
            {/* Progress bar skeleton */}
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            
            <div className="p-6 pt-8">
              <div className="animate-pulse space-y-4">
                {/* Title */}
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                
                {/* Date range */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                
                {/* Status badge */}
                <div className="flex">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {iterations
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .map((iteration) => {
          const iterationTasks = allTasks?.filter(task => task.iterationId === iteration._id) || [];
          const { progress, status } = calculateBurndownProgress(iteration.startDate, iteration.endDate, iterationTasks);
          
          return (
            <Link
              to={`/iterations/${iteration._id}`}
              key={iteration._id}
              className="block rounded-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden"
            >
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                    status === "ahead"
                      ? "bg-green-500 dark:bg-green-600"
                      : status === "on-track"
                      ? "bg-blue-500 dark:bg-blue-600"
                      : status === "behind"
                      ? "bg-yellow-500 dark:bg-yellow-600"
                      : "bg-red-500 dark:bg-red-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="p-6 pt-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {iteration.name}
                    </h2>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(iteration.startDate).toLocaleDateString()} - {new Date(iteration.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-2 py-1 text-sm ${
                      iteration.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    }`}>
                      {iteration.status}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {iteration.description}
                </p>
              </div>
            </Link>
          );
        })}
    </div>
  );
}
