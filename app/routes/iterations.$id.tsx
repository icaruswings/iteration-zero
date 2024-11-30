import { useParams } from "@remix-run/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import NewTaskModal from "../components/NewTaskModal";

export default function IterationDetails() {
  const { id } = useParams();
  const iteration = useQuery(api.iterations.getById, { id: id as Id<"iterations"> });
  const tasks = useQuery(api.tasks.listByIteration, { iterationId: id as Id<"iterations"> });
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  if (!iteration) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {iteration.name}
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {iteration.startDate} - {iteration.endDate}
          </span>
          <span className={`inline-block rounded-full px-2 py-1 text-sm ${
            iteration.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}>
            {iteration.status}
          </span>
        </div>
      </header>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Description
        </h2>
        <p className="text-gray-600 dark:text-gray-300">{iteration.description}</p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Goals
        </h2>
        <ul className="list-inside list-disc space-y-2">
          {iteration.goals.map((goal, index) => (
            <li key={index} className="text-gray-600 dark:text-gray-300">
              {goal}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Tasks
          </h2>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => setIsNewTaskModalOpen(true)}
          >
            New Task
          </button>
        </div>

        <div className="grid gap-4">
          {tasks?.map((task) => (
            <div
              key={task._id}
              className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">{task.description}</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Status: <span className="font-medium text-gray-900 dark:text-white">{task.status}</span></p>
                      <p className="text-sm text-gray-500">Priority: <span className="font-medium text-gray-900 dark:text-white">{task.priority}</span></p>
                      {task.assignee && (
                        <p className="text-sm text-gray-500">Assignee: <span className="font-medium text-gray-900 dark:text-white">{task.assignee}</span></p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time Estimates (days):</p>
                      <p className="text-sm text-gray-500">Best: <span className="font-medium text-gray-900 dark:text-white">{task.bestCaseEstimate}</span></p>
                      <p className="text-sm text-gray-500">Likely: <span className="font-medium text-gray-900 dark:text-white">{task.likelyCaseEstimate}</span></p>
                      <p className="text-sm text-gray-500">Worst: <span className="font-medium text-gray-900 dark:text-white">{task.worstCaseEstimate}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        iterationId={id as Id<"iterations">}
      />
    </div>
  );
}
