import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Id } from "convex/_generated/dataModel";
import { useState, useEffect } from "react";

type TaskStatus = "pending" | "in_progress" | "completed";

interface Task {
  _id: Id<"tasks">;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "High" | "Medium" | "Low";
  createdAt?: string;
  completedAt?: string;
  likelyCaseEstimate: number;
}

interface Column {
  title: string;
  status: TaskStatus;
}

interface TaskListProps {
  tasks: Task[];
  columns: Record<string, Column>;
  onStatusUpdate: (taskId: Id<"tasks">, newStatus: TaskStatus) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function getDaysDifference(startDate?: string, endDate?: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function TaskList({ tasks: serverTasks, columns, onStatusUpdate }: TaskListProps) {
  const [localTasks, setLocalTasks] = useState(serverTasks);

  // Update local tasks when server tasks change (except during drag)
  useEffect(() => {
    setLocalTasks(serverTasks);
  }, [serverTasks]);

  const getTasksByStatus = (status: TaskStatus) => {
    return localTasks.filter((task) => task.status === status);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = columns[destination.droppableId as keyof typeof columns].status;
    const taskId = draggableId as Id<"tasks">;
    
    // Optimistically update the local state
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === taskId 
          ? { ...task, status: newStatus }
          : task
      )
    );

    // Update the server state
    onStatusUpdate(taskId, newStatus);
  };

  return (
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
                  className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]"
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
                          className="bg-white dark:bg-gray-700 p-4 rounded shadow mb-2 cursor-move relative"
                        >
                          <div className={`absolute top-0 right-0 w-2 h-8 rounded-tr ${
                            task.priority === "High" 
                              ? "bg-red-500"
                              : task.priority === "Medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`} />
                          <h3 className="font-medium dark:text-gray-100">{task.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
                            {task.createdAt && (
                              <span className="text-gray-500 dark:text-gray-400">
                                Created: {formatDate(task.createdAt)}
                              </span>
                            )}
                            {task.status === "completed" ? (
                              <span className="text-gray-500 dark:text-gray-400">
                                Completed in {getDaysDifference(task.createdAt, task.completedAt)} days
                              </span>
                            ) : task.status === "in_progress" ? (
                              <span className="text-gray-500 dark:text-gray-400">
                                {getDaysDifference(task.createdAt)} days in progress
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                Est. {task.likelyCaseEstimate} days
                              </span>
                            )}
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
  );
}
