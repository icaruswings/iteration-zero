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
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderDash: [5, 5],
      },
      {
        label: "Likely Case (Estimated)",
        data: idealBurndown.likely,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderDash: [5, 5],
      },
      {
        label: "Worst Case (Estimated)",
        data: idealBurndown.worst,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderDash: [5, 5],
      },
      {
        label: "Actual Progress",
        data: actualBurndown,
        borderColor: "#FFBB28",
        backgroundColor: "rgba(255, 187, 40, 0.1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Iteration Burndown Chart",
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
          display: true,
          text: "Date",
        },
      },
    },
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <Line options={options} data={data} />
    </div>
  );
}
