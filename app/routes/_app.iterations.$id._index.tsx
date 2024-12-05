import { useNavigate, useParams } from "@remix-run/react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import NewTaskModal from "../components/NewTaskModal";
import EditIterationModal from "../components/EditIterationModal";
import BurndownChart from "~/components/BurndownChart";
import TaskList from "~/components/TaskList";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { nanoid } from "nanoid";
import { createEstimationSession } from "~/utils/estimation";
import { useAuth } from "@clerk/remix";

export default function IterationDetails() {
  const { id } = useParams();
  const iterationId = id as Id<"iterations">;

  const navigate = useNavigate();
  const convex = useConvex();
  const { userId  } = useAuth();

  const iteration = useQuery(api.iterations.get, { id: iterationId });
  const tasks = useQuery(api.tasks.list, { iterationId });
  const updateStatus = useMutation(api.tasks.updateStatus);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const startEstimationSession = async () => {
    const session = await convex.mutation(api.estimationSessions.create, {
      iterationId,
    });

    navigate(`/iterations/${iterationId}/estimation/${session._id}`);
  }

  if (!iteration || !tasks) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {iteration.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{iteration.description}</p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Iteration
          </button>
        </div>
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
              onClick={startEstimationSession}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Estimation Session
            </button>
          </div>
        </div>

        <TaskList
          tasks={tasks}
          columns={columns}
          onStatusUpdate={async (taskId, newStatus) => {
            await updateStatus({ iterationId, id: taskId, status: newStatus });
          }}
        />
      </div>

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          iterationId={iterationId}
        />
      )}

      {isEditModalOpen && (
        <EditIterationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          iteration={iteration}
        />
      )}
    </div>
  );
}
