import type { MetaFunction } from "@remix-run/node";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import NewIterationModal from "../components/NewIterationModal";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Development Iterations" },
    { name: "description", content: "Manage your software development iterations" },
  ];
};

export default function Index() {
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {iterations?.map((iteration) => (
          <Link
            to={`/iterations/${iteration._id}`}
            key={iteration._id}
            className="block rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {iteration.name}
            </h2>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {iteration.startDate} - {iteration.endDate}
            </div>
            <div className="mt-2">
              <span className={`inline-block rounded-full px-2 py-1 text-sm ${
                iteration.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {iteration.status}
              </span>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {iteration.description}
            </p>
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-200">Goals:</h3>
              <ul className="mt-2 list-inside list-disc">
                {iteration.goals.map((goal, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        ))}
      </div>

      <NewIterationModal
        isOpen={isNewIterationModalOpen}
        onClose={() => setIsNewIterationModalOpen(false)}
      />
    </div>
  );
}
