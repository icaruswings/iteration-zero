import { useParams } from "@remix-run/react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import NewTaskModal from "../components/NewTaskModal";
import BurndownChart from "~/components/BurndownChart";
import TaskList from "~/components/TaskList";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { nanoid } from "nanoid";
import { createEstimationSession } from "~/utils/estimation";

export default function IterationDetails() {
  const { id } = useParams();
  const convex = useConvex();
  const iterationId = id as Id<"iterations">;
  const iteration = useQuery(api.iterations.get, { id: iterationId });
  const tasks = useQuery(api.tasks.listByIteration, { iterationId });
  const updateStatus = useMutation(api.tasks.updateStatus);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const [columns] = useState({
    pending: {
      title: "Pending",
      status: "pending" as const,
    },
    inProgress: {
      title: "In Progress",
      status: "in_progress" as const,
    },
    completed: {
      title: "Completed",
      status: "completed" as const,
    },
  });

  if (!iteration || !tasks) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {iteration.name}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{iteration.description}</p>
      </header>

      <BurndownChart iterationId={id as Id<"iterations">} />

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Add Task
            </button>
            <button
              onClick={async () => {
                const managerId = nanoid();
                sessionStorage.setItem("participantId", managerId);
                sessionStorage.setItem("participantName", "Iteration Manager");
                
                const session = await createEstimationSession({
                  convex,
                  iterationId,
                  managerId,
                  managerName: "Iteration Manager",
                });

                window.open(`/estimation/${session.sessionUrl}`, "_blank");
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Estimation Session
            </button>
          </div>
        </div>

        <TaskList
          tasks={tasks}
          columns={columns}
          onStatusUpdate={(taskId, newStatus) => {
            updateStatus({ id: taskId, status: newStatus });
          }}
        />
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        iterationId={id as Id<"iterations">}
      />
    </div>
  );
}
