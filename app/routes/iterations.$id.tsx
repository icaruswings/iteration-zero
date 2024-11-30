import { useParams } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import NewTaskModal from "../components/NewTaskModal";
import BurndownChart from "~/components/BurndownChart";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export default function IterationDetails() {
  const { id } = useParams();
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

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = columns[destination.droppableId as keyof typeof columns].status;
    updateStatus({ id: draggableId as Id<"tasks">, status: newStatus });
  };

  if (!iteration || !tasks) return <div>Loading...</div>;

  const getTasksByStatus = (status: "pending" | "in_progress" | "completed") => {
    return tasks.filter((task) => task.status === status);
  };

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
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Tasks
          </h2>
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Task
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4">
            {Object.entries(columns).map(([columnId, column]) => (
              <div key={columnId} className="flex-1">
                <h2 className="font-semibold mb-2">{column.title}</h2>
                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="bg-gray-100 p-4 rounded-lg min-h-[200px]"
                    >
                      {getTasksByStatus(column.status).map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded shadow mb-2 cursor-move"
                            >
                              <h3 className="font-medium">{task.title}</h3>
                              <p className="text-sm text-gray-600">{task.description}</p>
                              <div className="mt-2 text-sm">
                                <span className={`px-2 py-1 rounded ${
                                  task.priority === "High" 
                                    ? "bg-red-100 text-red-800"
                                    : task.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        iterationId={id as Id<"iterations">}
      />
    </div>
  );
}
