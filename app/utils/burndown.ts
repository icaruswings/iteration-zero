import { Doc } from "../../convex/_generated/dataModel";

export enum BurndownStatus {
  Ahead = "ahead",
  OnTrack = "on-track",
  AtRisk = "at-risk",
  Behind = "behind",
};

export enum TShirtSize {
  SM = "SM",
  MD = "MD",
  LG = "LG",
  XLG = "XLG",
};

type CaseEstimate = {
  best: number;
  likely: number;
  worst: number;
};

// T-shirt size estimates represent real days
const ESTIMATE_DAYS: Record<TShirtSize, CaseEstimate> = {
  [TShirtSize.SM]: { best: 1, likely: 2, worst: 3 },    // 1-3 days
  [TShirtSize.MD]: { best: 2, likely: 3, worst: 5 },    // 2-5 days
  [TShirtSize.LG]: { best: 3, likely: 5, worst: 8 },    // 3-8 days
  [TShirtSize.XLG]: { best: 5, likely: 8, worst: 13 },  // 5-13 days
} as const;

/**
 * Calculates the progress of time between a start and end date as a percentage (0 to 100)
 * 
 * @param startDate - ISO string representing the start date
 * @param endDate - ISO string representing the end date
 * @param now - Optional timestamp in milliseconds representing the current time (defaults to Date.now())
 * @returns A number between 0 and 100 representing the progress percentage (0 = not started, 100 = completed)
 */
export function calculateTimeProgress(
  startDate: string,
  endDate: string,
  now = Date.now()
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (now < start) return 0;
  if (now >= end) return 100;

  const totalDuration = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / totalDuration) * 100);
}

/**
 * Calculates the percentage of work completed in an iteration based on task estimates
 * 
 * @param tasks - Array of tasks from the database
 * @returns Object containing completion percentages (0-100) for:
 *   - best: Best case scenario based on minimum effort estimates
 *   - likely: Most probable scenario based on average effort estimates
 *   - worst: Worst case scenario based on maximum effort estimates
 * 
 * @remarks
 * - Completed tasks count as 100% of their effort estimate
 * - In-progress tasks count as 50% of their effort estimate
 * - If there are no tasks or all tasks have 0 effort, returns 100% completion
 */
export function calculateEffortProgress(tasks: Doc<"tasks">[]): CaseEstimate {
  const totalEffort = calculateTotalEffort(tasks);
  if (
    totalEffort.best === 0
    && totalEffort.likely === 0
    && totalEffort.worst === 0
  ) {
    return { best: 100, likely: 100, worst: 100 };
  }

  const completedEffort = calculateCompletedEffort(tasks);
  const inProgressEffort = calculateInProgressEffort(tasks);

  const effectivePoints = {
    best: completedEffort.best + (inProgressEffort.best * 0.5),
    likely: completedEffort.likely + (inProgressEffort.likely * 0.5),
    worst: completedEffort.worst + (inProgressEffort.worst * 0.5),
  };

  return {
    best: Math.round((effectivePoints.best / totalEffort.best) * 100),
    likely: Math.round((effectivePoints.likely / totalEffort.likely) * 100),
    worst: Math.round((effectivePoints.worst / totalEffort.worst) * 100),
  };
}

/**
 * Calculates the expected end date for an iteration based on current velocity and remaining effort
 * 
 * @param startDate - ISO string representing the iteration start date
 * @param totalEffort - Total effort estimates for all tasks
 * @param completedEffort - Effort estimates for completed tasks
 * @param inProgressEffort - Effort estimates for in-progress tasks (counted as 50% complete)
 * @returns Object containing projected end dates:
 *   - best: Earliest possible completion date based on minimum effort estimates
 *   - likely: Most probable completion date based on average effort estimates
 *   - worst: Latest possible completion date based on maximum effort estimates
 * 
 * @remarks
 * - Velocity is calculated using the best-case progress divided by elapsed days
 * - If no progress has been made, assumes 1 day per effort point
 * - End dates cannot be earlier than the current date
 * - In-progress tasks are counted as 50% complete when calculating progress
 */
function calculateExpectedEndDate(
  startDate: string,
  totalEffort: CaseEstimate,
  completedEffort: CaseEstimate,
  inProgressEffort: CaseEstimate
): { best: Date; likely: Date; worst: Date } {
  const start = new Date(startDate);
  const progress = {
    best: completedEffort.best + (inProgressEffort.best / 2),
    likely: completedEffort.likely + (inProgressEffort.likely / 2),
    worst: completedEffort.worst + (inProgressEffort.worst / 2),
  };
  const elapsedDays = Math.max(1, (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate velocity based on completed work
  const velocity = progress.best === 0 ? 1 : progress.best / elapsedDays; // days per point
  
  // Calculate remaining days for each scenario
  const remainingBest = Math.max(0, totalEffort.best - progress.best);
  const remainingLikely = Math.max(0, totalEffort.likely - progress.likely);
  const remainingWorst = Math.max(0, totalEffort.worst - progress.worst);

  // Calculate end dates based on velocity and remaining effort
  const now = new Date();
  return {
    best: new Date(Math.max(now.getTime(), start.getTime() + (remainingBest / velocity) * 24 * 60 * 60 * 1000)),
    likely: new Date(Math.max(now.getTime(), start.getTime() + (remainingLikely / velocity) * 24 * 60 * 60 * 1000)),
    worst: new Date(Math.max(now.getTime(), start.getTime() + (remainingWorst / velocity) * 24 * 60 * 60 * 1000)),
  };
}

/**
 * Determines the current status of an iteration based on progress and timeline
 * 
 * @param timeProgress - Percentage of time elapsed (0-100)
 * @param effortProgress - Object containing effort completion percentages (0-100)
 * @param endDate - ISO string of planned end date, or null if not set
 * @param expectedEndDate - Calculated end dates based on current velocity
 * @returns BurndownStatus indicating the iteration's health:
 *   - Ahead: Progress is 20% or more ahead of time elapsed
 *   - OnTrack: Progress is within 10% behind to 20% ahead of time
 *   - AtRisk: Progress is 10-20% behind OR tasks likely won't fit in timeline
 *   - Behind: Progress is more than 20% behind time elapsed
 * 
 * @remarks
 * Status is determined by two factors:
 * 1. Whether tasks are likely to fit within the planned end date
 * 2. The difference between effort progress and time progress
 * 
 * The likely case scenario is used for all comparisons
 */
function calculateIterationStatus(
  timeProgress: number,
  effortProgress: CaseEstimate,
  endDate: string | null,
  expectedEndDate: { best: Date; likely: Date; worst: Date }
): BurndownStatus {
  // If all tasks are completed, we're ahead unless we're past the end date
  if (effortProgress.likely === 100) {
    // Only check end date if it's provided
    if (endDate) {
      const end = new Date(endDate);
      const now = new Date();
      return now > end ? BurndownStatus.OnTrack : BurndownStatus.Ahead;
    }
    // Without end date, completing all tasks means we're ahead
    return BurndownStatus.Ahead;
  }

  // If there's an end date, check if we've passed it
  if (endDate) {
    const end = new Date(endDate);
    const now = new Date();
    
    if (now > end) {
      return BurndownStatus.Behind;
    }
    
    if (expectedEndDate.likely > end) {
      // Tasks don't fit in the timeline
      return BurndownStatus.AtRisk;
    }
  }

  // If we haven't started yet (time progress is 0), we're on track
  if (timeProgress === 0) {
    return BurndownStatus.OnTrack;
  }

  // Use the likely scenario for status calculation
  const progress = effortProgress.likely;
  const progressDifference = Number((progress / 100 - timeProgress / 100).toFixed(2));
  
  if (progressDifference >= 0.20) return BurndownStatus.Ahead;
  if (progressDifference > -0.10) return BurndownStatus.OnTrack;
  if (progressDifference > -0.20) return BurndownStatus.AtRisk;
  return BurndownStatus.Behind;
}

/**
 * Calculates all metrics needed for the iteration burndown chart and status display
 * 
 * @param startDate - ISO string representing the iteration start date
 * @param endDate - ISO string representing the planned end date, or null if not set
 * @param tasks - Array of tasks from the database
 * @returns Object containing:
 *   - timeProgress: Percentage of time elapsed (0-100)
 *   - effortProgress: Completion percentages for best/likely/worst cases
 *   - status: Current iteration health (ahead/on-track/at-risk/behind)
 *   - totalEffort: Total effort estimates for all tasks
 *   - completedEffort: Effort estimates for completed tasks
 *   - inProgressEffort: Effort estimates for in-progress tasks
 *   - expectedEndDate: Projected completion dates based on velocity
 * 
 * @remarks
 * - If no end date is provided, uses the likely expected end date for time progress
 * - Time progress is calculated as a percentage of elapsed time
 * - Effort progress accounts for both completed and in-progress tasks
 * - In-progress tasks count as 50% complete in calculations
 */
export function calculateBurndownProgress(
  startDate: string,
  endDate: string | null,
  tasks: Doc<"tasks">[]
): {
  timeProgress: number;
  effortProgress: CaseEstimate;
  status: BurndownStatus;
  totalEffort: CaseEstimate;
  completedEffort: CaseEstimate;
  inProgressEffort: CaseEstimate;
  expectedEndDate: { best: Date; likely: Date; worst: Date };
} {
  const totalEffort = calculateTotalEffort(tasks);
  const completedEffort = calculateCompletedEffort(tasks);
  const inProgressEffort = calculateInProgressEffort(tasks);
  const effortProgress = calculateEffortProgress(tasks);

  try {
    const expectedEndDate = calculateExpectedEndDate(
      startDate,
      totalEffort,
      completedEffort,
      inProgressEffort
    );

    const timeProgress = endDate 
      ? calculateTimeProgress(startDate, endDate) 
      : calculateTimeProgress(startDate, expectedEndDate.likely.toISOString());

    const status = calculateIterationStatus(
      timeProgress,
      effortProgress,
      endDate,
      expectedEndDate
    );

    return {
      timeProgress,
      effortProgress,
      status,
      totalEffort,
      completedEffort,
      inProgressEffort,
      expectedEndDate,
    };
  } catch (error) {
    // Handle invalid dates by returning a sensible default state
    return {
      timeProgress: 0,
      effortProgress,
      status: BurndownStatus.OnTrack, // Default to on-track for invalid dates
      totalEffort,
      completedEffort,
      inProgressEffort,
      expectedEndDate: {
        best: new Date(),
        likely: new Date(),
        worst: new Date(),
      },
    };
  }
}

/**
 * Calculates the total effort estimates for all tasks in the iteration
 * 
 * @param tasks - Array of tasks from the database
 * @returns Object containing effort estimates for:
 *   - best: Minimum effort based on t-shirt size estimates
 *   - likely: Average effort based on t-shirt size estimates
 *   - worst: Maximum effort based on t-shirt size estimates
 */
export function calculateTotalEffort(tasks: Doc<"tasks">[]): CaseEstimate {
  return tasks.reduce((sum, task) => {
      const estimate = task.estimate ? ESTIMATE_DAYS[task.estimate] : { best: 0, likely: 0, worst: 0 };

      return {
        best: sum.best + estimate.best,
        likely: sum.likely + estimate.likely,
        worst: sum.worst + estimate.worst,
      };
    }, { best: 0, likely: 0, worst: 0 });
}

/**
 * Calculates the total effort for completed tasks in the iteration
 * 
 * @param tasks - Array of tasks from the database
 * @returns Object containing effort estimates for completed tasks:
 *   - best: Minimum effort based on t-shirt size estimates
 *   - likely: Average effort based on t-shirt size estimates
 *   - worst: Maximum effort based on t-shirt size estimates
 */
function calculateCompletedEffort(tasks: Doc<"tasks">[]): CaseEstimate {
  return tasks
    .filter(task => task.status === "completed")
    .reduce((sum, task) => {
        const estimate = task.estimate ? ESTIMATE_DAYS[task.estimate] : { best: 0, likely: 0, worst: 0 };
        
        return {
          best: sum.best + estimate.best,
          likely: sum.likely + estimate.likely,
          worst: sum.worst + estimate.worst,
        };
      }, { best: 0, likely: 0, worst: 0 });
}

/**
 * Calculates the total effort for in-progress tasks in the iteration
 * 
 * @param tasks - Array of tasks from the database
 * @returns Object containing effort estimates for in-progress tasks:
 *   - best: Minimum effort based on t-shirt size estimates
 *   - likely: Average effort based on t-shirt size estimates
 *   - worst: Maximum effort based on t-shirt size estimates
 */
function calculateInProgressEffort(tasks: Doc<"tasks">[]): CaseEstimate {
  return tasks
    .filter(task => task.status === "in_progress")
    .reduce((sum, task) => {
        const estimate = task.estimate ? ESTIMATE_DAYS[task.estimate] : { best: 0, likely: 0, worst: 0 };
        
        return {
          best: sum.best + estimate.best,
          likely: sum.likely + estimate.likely,
          worst: sum.worst + estimate.worst,
        };
      }, { best: 0, likely: 0, worst: 0 });
}
