import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NewIterationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewIterationModal({ isOpen, onClose }: NewIterationModalProps) {
  const createIteration = useMutation(api.iterations.create);
  const [goals, setGoals] = useState<string[]>([""]);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredGoals = goals.filter((goal) => goal.trim() !== "");
    
    await createIteration({
      ...formData,
      goals: filteredGoals,
    });
    
    onClose();
  };

  const addGoal = () => {
    setGoals([...goals, ""]);
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          New Iteration
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                required
                className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="date"
                required
                className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              required
              className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Goals
            </label>
            {goals.map((goal, index) => (
              <div key={index} className="mb-2">
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                  value={goal}
                  onChange={(e) => updateGoal(index, e.target.value)}
                  placeholder={`Goal ${index + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addGoal}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + Add Goal
            </button>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
