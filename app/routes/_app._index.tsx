import type { MetaFunction } from "@remix-run/node";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Development Iterations Dashboard" },
    { name: "description", content: "Overview of your development iterations and progress" },
  ];
};

export default function Dashboard() {
  const activeIterations = useQuery(api.iterations.list, { status: "active" });
  const recentTasks = useQuery(api.tasks.listRecent);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Overview of your development progress
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Iterations Section */}
        <section className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
            Active Iterations
          </h2>
          <div className="space-y-4">
            {activeIterations?.map((iteration) => (
              <Link
                to={`/iterations/${iteration._id}`}
                key={iteration._id}
                className="block rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <h3 className="font-medium text-gray-800 dark:text-gray-100">
                  {iteration.name}
                </h3>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {iteration.startDate} - {iteration.endDate}
                </div>
              </Link>
            ))}
            <Link
              to="/iterations"
              className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all iterations →
            </Link>
          </div>
        </section>

        {/* Recent Tasks Section */}
        <section className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
            Recent Tasks
          </h2>
          <div className="space-y-4">
            {recentTasks?.map((task) => (
              <div
                key={task._id}
                className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
              >
                <h3 className="font-medium text-gray-800 dark:text-gray-100">
                  {task.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Est. {task.likelyCaseEstimate} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
