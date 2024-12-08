import { describe, it, expect, vi, afterAll, beforeAll } from 'vitest';
import { 
  calculateBurndownProgress, 
  calculateTimeProgress,
  calculateEffortProgress,
  calculateTotalEffort,
  BurndownStatus,
  TShirtSize
} from './burndown';
import { Doc, Id } from '../../convex/_generated/dataModel';

type Task = Doc<"tasks">;

describe('burndown calculations', () => {
  // Mock tasks with various states and estimates
  const mockTasks: Task[] = [
    { 
      _id: 'task1' as Id<"tasks">,
      _creationTime: 0,
      createdBy: 'user1',
      iterationId: 'iter1' as Id<"iterations">,
      title: 'Task 1',
      description: '',
      priority: 'Medium' as const,
      status: 'completed' as const,
      estimate: TShirtSize.MD,  // 2-5 days
      createdAt: '2024-01-01',
    },
    { 
      _id: 'task2' as Id<"tasks">,
      _creationTime: 0,
      createdBy: 'user1',
      iterationId: 'iter1' as Id<"iterations">,
      title: 'Task 2',
      description: '',
      priority: 'Medium' as const,
      status: 'in_progress' as const,
      estimate: TShirtSize.LG,  // 3-8 days
      createdAt: '2024-01-01',
    },
    { 
      _id: 'task3' as Id<"tasks">,
      _creationTime: 0,
      createdBy: 'user1',
      iterationId: 'iter1' as Id<"iterations">,
      title: 'Task 3',
      description: '',
      priority: 'Medium' as const,
      status: 'pending' as const,
      estimate: TShirtSize.XLG,  // 5-13 days
      createdAt: '2024-01-01',
    }
  ];

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('calculateTimeProgress', () => {
    it('should return 0 before start date', () => {
      const now = new Date('2024-01-09');
      vi.setSystemTime(now);
      const progress = calculateTimeProgress('2024-01-10', '2024-01-20');
      expect(progress).toBe(0);
    });

    it('should return 50 halfway through iteration', () => {
      const now = new Date('2024-01-15');
      vi.setSystemTime(now);
      const progress = calculateTimeProgress('2024-01-10', '2024-01-20');
      expect(progress).toBe(50);
    });

    it('should return 100 after end date', () => {
      const now = new Date('2024-01-21');
      vi.setSystemTime(now);
      const progress = calculateTimeProgress('2024-01-10', '2024-01-20');
      expect(progress).toBe(100);
    });

    it('should handle same start and end date', () => {
      const now = new Date('2024-01-10T12:00:00');
      vi.setSystemTime(now);
      const progress = calculateTimeProgress('2024-01-10', '2024-01-10');
      expect(progress).toBe(100);
    });

    it('should handle millisecond precision', () => {
      const now = new Date('2024-01-10T12:30:00.500');
      vi.setSystemTime(now);
      const progress = calculateTimeProgress(
        '2024-01-10T12:00:00.000',
        '2024-01-10T13:00:00.000'
      );
      expect(progress).toBe(50);
    });

    it('should handle end date before start date', () => {
      const now = new Date('2024-01-15');
      vi.setSystemTime(now);
      const progress = calculateTimeProgress('2024-01-20', '2024-01-10');
      expect(progress).toBe(0);
    });
  });

  describe('calculateEffortProgress', () => {
    it('should return 100% for empty task list', () => {
      const progress = calculateEffortProgress([]);
      expect(progress).toEqual({ best: 100, likely: 100, worst: 100 });
    });

    it('should calculate progress with completed and in-progress tasks', () => {
      const progress = calculateEffortProgress(mockTasks);
      expect(progress).toEqual({
        best: 35,
        likely: 34,
        worst: 35
      });
    });

    it('should handle all completed tasks', () => {
      const allCompleted = mockTasks.map(task => ({
        ...task,
        status: 'completed' as const
      }));
      const progress = calculateEffortProgress(allCompleted);
      expect(progress).toEqual({
        best: 100,
        likely: 100,
        worst: 100
      });
    });

    it('should handle all in-progress tasks', () => {
      const allInProgress = mockTasks.map(task => ({
        ...task,
        status: 'in_progress' as const
      }));
      const progress = calculateEffortProgress(allInProgress);
      expect(progress.likely).toBe(50);
    });

    it('should handle tasks without estimates', () => {
      const noEstimates = mockTasks.map(task => ({
        ...task,
        estimate: undefined
      }));
      const progress = calculateEffortProgress(noEstimates);
      expect(progress).toEqual({
        best: 100,
        likely: 100,
        worst: 100
      });
    });

    it('should handle mix of tasks with and without estimates', () => {
      const mixedTasks = [
        { ...mockTasks[0], estimate: TShirtSize.MD }, 
        { ...mockTasks[1], estimate: undefined }, 
        { ...mockTasks[2], estimate: TShirtSize.SM }, 
      ];
      const progress = calculateEffortProgress(mixedTasks);
      expect(progress.best).toBeGreaterThan(0);
      expect(progress.best).toBeLessThan(100);
    });
  });

  describe('calculateTotalEffort', () => {
    it('should return zero effort for empty tasks array', () => {
      const effort = calculateTotalEffort([]);
      expect(effort).toEqual({
        best: 0,
        likely: 0,
        worst: 0,
      });
    });

    it('should calculate correct effort for a single task', () => {
      const tasks: Task[] = [{
        _id: 'task1' as Id<"tasks">,
        _creationTime: 0,
        createdBy: 'user1',
        iterationId: 'iter1' as Id<"iterations">,
        title: 'Task 1',
        description: '',
        priority: 'Medium',
        status: 'pending',
        estimate: TShirtSize.MD,  // MD = best: 2, likely: 3, worst: 5
        createdAt: '2024-01-01',
      }];

      const effort = calculateTotalEffort(tasks);
      expect(effort).toEqual({
        best: 2,
        likely: 3,
        worst: 5,
      });
    });

    it('should sum effort correctly for multiple tasks', () => {
      const tasks: Task[] = [
        {
          _id: 'task1' as Id<"tasks">,
          _creationTime: 0,
          createdBy: 'user1',
          iterationId: 'iter1' as Id<"iterations">,
          title: 'Task 1',
          description: '',
          priority: 'Medium',
          status: 'pending',
          estimate: TShirtSize.SM,  // SM = best: 1, likely: 2, worst: 3
          createdAt: '2024-01-01',
        },
        {
          _id: 'task2' as Id<"tasks">,
          _creationTime: 0,
          createdBy: 'user1',
          iterationId: 'iter1' as Id<"iterations">,
          title: 'Task 2',
          description: '',
          priority: 'Medium',
          status: 'pending',
          estimate: TShirtSize.LG,  // LG = best: 3, likely: 5, worst: 8
          createdAt: '2024-01-01',
        },
      ];

      const effort = calculateTotalEffort(tasks);
      expect(effort).toEqual({
        best: 4,    // 1 + 3
        likely: 7,  // 2 + 5
        worst: 11,  // 3 + 8
      });
    });

    it('should handle all t-shirt sizes', () => {
      const tasks: Task[] = [
        {
          _id: 'task1' as Id<"tasks">,
          _creationTime: 0,
          createdBy: 'user1',
          iterationId: 'iter1' as Id<"iterations">,
          title: 'Task 1',
          description: '',
          priority: 'Medium',
          status: 'pending',
          estimate: TShirtSize.SM,  // SM = best: 1, likely: 2, worst: 3
          createdAt: '2024-01-01',
        },
        {
          _id: 'task2' as Id<"tasks">,
          _creationTime: 0,
          createdBy: 'user1',
          iterationId: 'iter1' as Id<"iterations">,
          title: 'Task 2',
          description: '',
          priority: 'Medium',
          status: 'pending',
          estimate: TShirtSize.MD,  // MD = best: 2, likely: 3, worst: 5
          createdAt: '2024-01-01',
        },
        {
          _id: 'task3' as Id<"tasks">,
          _creationTime: 0,
          createdBy: 'user1',
          iterationId: 'iter1' as Id<"iterations">,
          title: 'Task 3',
          description: '',
          priority: 'Medium',
          status: 'pending',
          estimate: TShirtSize.LG,  // LG = best: 3, likely: 5, worst: 8
          createdAt: '2024-01-01',
        },
        {
          _id: 'task4' as Id<"tasks">,
          _creationTime: 0,
          createdBy: 'user1',
          iterationId: 'iter1' as Id<"iterations">,
          title: 'Task 4',
          description: '',
          priority: 'Medium',
          status: 'pending',
          estimate: TShirtSize.XLG,  // XLG = best: 5, likely: 8, worst: 13
          createdAt: '2024-01-01',
        },
      ];

      const effort = calculateTotalEffort(tasks);
      expect(effort).toEqual({
        best: 11,   // 1 + 2 + 3 + 5
        likely: 18, // 2 + 3 + 5 + 8
        worst: 29,  // 3 + 5 + 8 + 13
      });
    });
  });

  describe('calculateBurndownProgress', () => {
    describe('with end date provided', () => {
      it('should calculate overall progress halfway through', () => {
        const now = new Date('2024-01-15');
        vi.setSystemTime(now);
        const result = calculateBurndownProgress(
          '2024-01-10',
          '2024-01-20',
          mockTasks
        );
        expect(result.timeProgress).toBe(50);
        expect(result.effortProgress.likely).toBe(34);
        expect(result.status).toBe(BurndownStatus.AtRisk);
      });

      it('should handle end date before current date', () => {
        const now = new Date('2024-01-25');
        vi.setSystemTime(now);
        const result = calculateBurndownProgress(
          '2024-01-10',
          '2024-01-20',
          mockTasks
        );
        expect(result.timeProgress).toBe(100);
        expect(result.status).toBe(BurndownStatus.Behind);
      });

      it('should handle end date equal to start date', () => {
        const now = new Date('2024-01-10T12:00:00');
        vi.setSystemTime(now);
        const result = calculateBurndownProgress(
          '2024-01-10',
          '2024-01-10',
          mockTasks
        );
        expect(result.timeProgress).toBe(100);
        expect(result.status).toBe(BurndownStatus.Behind);
      });

      it('should be ahead when completed early', () => {
        const now = new Date('2024-01-12');
        vi.setSystemTime(now);
        const allCompleted = mockTasks.map(task => ({
          ...task,
          status: 'completed' as const
        }));
        const result = calculateBurndownProgress(
          '2024-01-10',
          '2024-01-20',
          allCompleted
        );
        expect(result.timeProgress).toBe(20);
        expect(result.effortProgress.likely).toBe(100);
        expect(result.status).toBe(BurndownStatus.Ahead);
      });
    });

    describe('without end date provided', () => {
      it('should use expected end date for time progress', () => {
        const now = new Date('2024-01-15');
        vi.setSystemTime(now);
        const result = calculateBurndownProgress(
          '2024-01-10',
          null,
          mockTasks
        );
        expect(result.timeProgress).toBeGreaterThan(0);
        expect(result.timeProgress).toBeLessThan(100);
        expect(result.expectedEndDate.likely instanceof Date).toBe(true);
      });

      it('should handle all tasks completed', () => {
        const now = new Date('2024-01-15');
        vi.setSystemTime(now);
        const allCompleted = mockTasks.map(task => ({
          ...task,
          status: 'completed' as const
        }));
        const result = calculateBurndownProgress(
          '2024-01-10',
          null,
          allCompleted
        );
        expect(result.effortProgress.likely).toBe(100);
        expect(result.status).toBe(BurndownStatus.Ahead);
      });

      it('should handle no progress made', () => {
        const now = new Date('2024-01-15');
        vi.setSystemTime(now);
        const noneStarted = mockTasks.map(task => ({
          ...task,
          status: 'pending' as const
        }));
        const result = calculateBurndownProgress(
          '2024-01-10',
          null,
          noneStarted
        );
        expect(result.effortProgress.likely).toBe(0);
        expect(result.status).toBe(BurndownStatus.Behind);
      });

      it('should handle start date in future', () => {
        const now = new Date('2024-01-05');
        vi.setSystemTime(now);
        const result = calculateBurndownProgress(
          '2024-01-10',
          null,
          mockTasks
        );
        expect(result.timeProgress).toBe(0);
        expect(result.status).toBe(BurndownStatus.OnTrack);
      });
    });

    describe('edge cases', () => {
      it('should handle empty task list', () => {
        const result = calculateBurndownProgress(
          '2024-01-10',
          '2024-01-20',
          []
        );
        expect(result.effortProgress).toEqual({
          best: 100,
          likely: 100,
          worst: 100
        });
        expect(result.status).toBe(BurndownStatus.Ahead);
      });

      it('should handle tasks without estimates', () => {
        const noEstimates = mockTasks.map(task => ({
          ...task,
          estimate: undefined
        }));
        const result = calculateBurndownProgress(
          '2024-01-10',
          '2024-01-20',
          noEstimates
        );
        expect(result.effortProgress).toEqual({
          best: 100,
          likely: 100,
          worst: 100
        });
      });

      it('should handle invalid dates', () => {
        const now = new Date('2024-01-15');
        vi.setSystemTime(now);
        const result = calculateBurndownProgress(
          'invalid date',
          null,
          mockTasks
        );
        expect(result.timeProgress).toBe(0);
        expect(result.status).toBe(BurndownStatus.OnTrack);
      });
    });
  });
});
