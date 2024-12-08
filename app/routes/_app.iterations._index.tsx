import type { MetaFunction } from "@remix-run/node";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import NewIterationModal from "../components/NewIterationModal";
import IterationList from "../components/IterationList";

export const meta: MetaFunction = () => {
  return [
    { title: "Iterations" },
    { name: "description", content: "Manage your software development iterations" },
  ];
};

export default function Iterations() {
  const iterations = useQuery(api.iterations.list);
  const [isNewIterationModalOpen, setIsNewIterationModalOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Development Iterations
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Manage and track your software development iterations
        </p>
      </header>

      <div className="mb-6">
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setIsNewIterationModalOpen(true)}
        >
          New Iteration
        </button>
      </div>

      <IterationList iterations={iterations} />

      <NewIterationModal
        isOpen={isNewIterationModalOpen}
        onClose={() => setIsNewIterationModalOpen(false)}
      />
    </div>
  );
}
