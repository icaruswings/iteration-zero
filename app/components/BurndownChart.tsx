import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BurndownChartProps {
  iterationId: Id<"iterations">;
}

export default function BurndownChart({ iterationId }: BurndownChartProps) {
  const [showHint, setShowHint] = useState(() => {
    const stored = localStorage.getItem('burndown-chart-hint');
    return stored === null ? true : stored === 'true';
  });

  const handleCloseHint = () => {
    setShowHint(false);
    localStorage.setItem('burndown-chart-hint', 'false');
  };

  const iteration = useQuery(api.iterations.get, { id: iterationId });
  const tasks = useQuery(api.tasks.listByIteration, { iterationId });

  if (!iteration || !tasks) return null;

  const startDate = new Date(iteration.startDate);
  const endDate = new Date(iteration.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate total effort for each scenario
  const totalEffort = {
    best: tasks.reduce((sum, task) => sum + task.bestCaseEstimate, 0),
    likely: tasks.reduce((sum, task) => sum + task.likelyCaseEstimate, 0),
    worst: tasks.reduce((sum, task) => sum + task.worstCaseEstimate, 0),
  };

  // Generate dates array
  const dates = Array.from({ length: totalDays + 1 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  // Calculate ideal burndown lines
  const idealBurndown = {
    best: dates.map((_, i) => totalEffort.best * (1 - i / totalDays)),
    likely: dates.map((_, i) => totalEffort.likely * (1 - i / totalDays)),
    worst: dates.map((_, i) => totalEffort.worst * (1 - i / totalDays)),
  };

  // Calculate actual burndown line
  const actualBurndown = dates.map(date => {
    const completedTasks = tasks.filter(task => 
      task.status === "completed" && 
      task.completedAt && 
      task.completedAt.split('T')[0] <= date
    );
    const completedEffort = completedTasks.reduce((sum, task) => sum + task.likelyCaseEstimate, 0);
    return totalEffort.likely - completedEffort;
  });

  const data = {
    labels: dates.map(d => new Date(d).toLocaleDateString()),
    datasets: [
      {
        label: "Best Case (Estimated)",
        data: idealBurndown.best,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
      },
      {
        label: "Likely Case (Estimated)",
        data: idealBurndown.likely,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
      },
      {
        label: "Worst Case (Estimated)",
        data: idealBurndown.worst,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
      },
      {
        label: "Actual Progress",
        data: actualBurndown,
        borderColor: "#FFBB28",
        backgroundColor: "transparent",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Remaining Effort (days)",
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      {showHint && (
        <div className="relative text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCloseHint}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close hint"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <p className="mb-2">
            <span className="font-medium">How to read this chart:</span> The burndown chart shows the remaining effort over time.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>The dashed lines show the ideal progress based on different estimates (best, likely, and worst case scenarios)</li>
            <li>The solid yellow line shows the actual progress as tasks are completed</li>
            <li>If the yellow line is below the dashed lines, you're ahead of schedule</li>
            <li>If the yellow line is above the dashed lines, you're behind schedule</li>
          </ul>
        </div>
      )}
      <div className="w-full rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="w-full aspect-[2/1]">
          <Line options={options} data={data} />
        </div>
      </div>
    </div>
  );
}
