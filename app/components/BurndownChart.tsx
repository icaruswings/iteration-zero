import { Doc } from "../../convex/_generated/dataModel";
import { calculateBurndownProgress } from "~/utils/burndown";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from "react-chartjs-2";
import { Card } from "./ui/card";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface BurndownChartProps {
  startDate: string;
  endDate: string | null;
  tasks: Doc<"tasks">[];
}

export function BurndownChart({ startDate, endDate, tasks }: BurndownChartProps) {
  const progress = calculateBurndownProgress(startDate, endDate, tasks);
  
  // Calculate the initial timeline based on the total effort (likely case)
  const startTime = new Date(startDate).getTime();
  const totalDays = progress.totalEffort.likely; // One day per effort point
  const staticEndTime = startTime + (totalDays * 24 * 60 * 60 * 1000);
  
  const labels = [];
  const bestData = [];
  const likelyData = [];
  const worstData = [];
  const actualBestData = [];
  const actualLikelyData = [];
  const actualWorstData = [];
  
  // Calculate velocities for each scenario relative to the likely case
  const bestVelocity = progress.totalEffort.best / progress.totalEffort.likely;
  const worstVelocity = progress.totalEffort.worst / progress.totalEffort.likely;
  
  // Create timelines of completed tasks for each scenario
  const completedTimelines = {
    best: new Map<string, number>(),
    likely: new Map<string, number>(),
    worst: new Map<string, number>(),
  };

  let runningTotals = {
    best: progress.totalEffort.best,
    likely: progress.totalEffort.likely,
    worst: progress.totalEffort.worst,
  };

  // Initialize start points
  completedTimelines.best.set(startDate, runningTotals.best);
  completedTimelines.likely.set(startDate, runningTotals.likely);
  completedTimelines.worst.set(startDate, runningTotals.worst);

  // Sort tasks by completion date
  const completedTasks = tasks
    .filter(task => task.status === 'completed' && task.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

  // Build timeline of completed work
  completedTasks.forEach(task => {
    if (task.estimate && task.completedAt) {
      const estimate = task.estimate;
      switch (estimate) {
        case 'SM':
          runningTotals.best -= 1;
          runningTotals.likely -= 2;
          runningTotals.worst -= 3;
          break;
        case 'MD':
          runningTotals.best -= 2;
          runningTotals.likely -= 3;
          runningTotals.worst -= 5;
          break;
        case 'LG':
          runningTotals.best -= 3;
          runningTotals.likely -= 5;
          runningTotals.worst -= 8;
          break;
        case 'XLG':
          runningTotals.best -= 5;
          runningTotals.likely -= 8;
          runningTotals.worst -= 13;
          break;
      }
      completedTimelines.best.set(task.completedAt, Math.max(0, runningTotals.best));
      completedTimelines.likely.set(task.completedAt, Math.max(0, runningTotals.likely));
      completedTimelines.worst.set(task.completedAt, Math.max(0, runningTotals.worst));
    }
  });

  // Add current date to timeline if there's still work remaining
  const now = new Date().toISOString();
  if (!completedTimelines.best.has(now)) {
    completedTimelines.best.set(now, runningTotals.best);
    completedTimelines.likely.set(now, runningTotals.likely);
    completedTimelines.worst.set(now, runningTotals.worst);
  }
  
  for (let day = 0; day <= totalDays; day++) {
    const date = new Date(startTime + day * 24 * 60 * 60 * 1000);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    // Calculate remaining work for each scenario based on their relative velocities
    const timeProgress = day / totalDays;
    
    // Best case burns down faster
    const bestProgress = Math.min(1, timeProgress / bestVelocity);
    bestData.push(Math.max(0, progress.totalEffort.best * (1 - bestProgress)));

    // Likely case burns down linearly
    likelyData.push(Math.max(0, progress.totalEffort.likely * (1 - timeProgress)));

    // Worst case burns down slower
    const worstProgress = Math.min(1, timeProgress * bestVelocity);
    worstData.push(Math.max(0, progress.totalEffort.worst * (1 - worstProgress)));

    // Find actual progress for this date
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of current day
    
    // Only add actual data points up to current date
    if (date <= currentDate) {
      // Find the last completed values before or on this date
      let actualBestValue = progress.totalEffort.best;
      let actualLikelyValue = progress.totalEffort.likely;
      let actualWorstValue = progress.totalEffort.worst;
      
      for (const [completedDate, bestValue] of completedTimelines.best) {
        if (completedDate <= date.toISOString()) {
          actualBestValue = bestValue;
        } else {
          break;
        }
      }
      
      for (const [completedDate, likelyValue] of completedTimelines.likely) {
        if (completedDate <= date.toISOString()) {
          actualLikelyValue = likelyValue;
        } else {
          break;
        }
      }
      
      for (const [completedDate, worstValue] of completedTimelines.worst) {
        if (completedDate <= date.toISOString()) {
          actualWorstValue = worstValue;
        } else {
          break;
        }
      }
      
      actualBestData.push(actualBestValue);
      actualLikelyData.push(actualLikelyValue);
      actualWorstData.push(actualWorstValue);
    } else {
      actualBestData.push(null);
      actualLikelyData.push(null);
      actualWorstData.push(null);
    }
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Best Case (Estimated)',
        data: bestData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderDash: [5, 5],
      },
      {
        label: 'Best Case (Actual)',
        data: actualBestData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 2,
      },
      {
        label: 'Likely Case (Estimated)',
        data: likelyData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderDash: [5, 5],
      },
      {
        label: 'Likely Case (Actual)',
        data: actualLikelyData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
      },
      {
        label: 'Worst Case (Estimated)',
        data: worstData,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        borderDash: [5, 5],
      },
      {
        label: 'Worst Case (Actual)',
        data: actualWorstData,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
      annotation: endDate ? {
        annotations: {
          endDateLine: {
            type: 'line',
            xMin: new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            xMax: new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            borderColor: 'rgb(107, 114, 128)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'End Date',
              position: 'start'
            }
          }
        }
      } : undefined
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Effort (Days)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <Card className="p-4">
      <div className="h-[300px]">
        <Line options={options} data={data} />
      </div>
    </Card>
  );
}