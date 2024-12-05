import { describe, it, expect, vi, afterAll, beforeAll } from 'vitest';
import { calculateBurndownProgress } from './burndown';
import { Doc } from '../../convex/_generated/dataModel';

type Task = Doc<"tasks">;

describe('calculateBurndownProgress', () => {
  const mockTasks = [
    { 
      _id: 'task1' as const,
      _creationTime: 0,
      createdBy: 'user1',
      iterationId: 'iter1',
      title: 'Task 1',
      description: '',
      priority: 'Medium' as const,
      status: 'completed' as const,
      estimate: 2,
      createdAt: '2024-01-01',
    },
    { 
      _id: 'task2' as const,
      _creationTime: 0,
      createdBy: 'user1',
      iterationId: 'iter1',
      title: 'Task 2',
      description: '',
      priority: 'Medium' as const,
      status: 'in_progress' as const,
      estimate: 3,
      createdAt: '2024-01-01',
    },
    { 
      _id: 'task3' as const,
      _creationTime: 0,
      createdBy: 'user1',
      iterationId: 'iter1',
      title: 'Task 3',
      description: '',
      priority: 'Medium' as const,
      status: 'pending' as const,
      estimate: 5,
      createdAt: '2024-01-01',
    }
  ] as Task[];

  beforeAll(() => {
    vi.useFakeTimers();
  });

  it('should show 50% progress when halfway through iteration', () => {
    const now = new Date('2024-01-15');
    vi.setSystemTime(now);

    const result = calculateBurndownProgress(
      '2024-01-10',  // 5 days ago
      '2024-01-20',  // 5 days left
      mockTasks
    );

    expect(result.progress).toBe(50);
    expect(result.status).toBe('behind'); // Completed 2/10 points = 20% work with 50% time
  });

  it('should show 22% progress when roughly quarter through iteration', () => {
    const now = new Date('2024-01-12T12:00:00');
    vi.setSystemTime(now);

    const result = calculateBurndownProgress(
      '2024-01-10',  // Started 2.5 days ago
      '2024-01-20',  // 7.5 days left
      mockTasks
    );

    expect(result.progress).toBe(22); // ~2.5 days out of ~10 days = ~22%
  });

  it('should show 100% progress after end date', () => {
    const now = new Date('2024-01-21');
    vi.setSystemTime(now);

    const result = calculateBurndownProgress(
      '2024-01-10',
      '2024-01-20',
      mockTasks
    );

    expect(result.progress).toBe(100);
  });

  it('should show 0% progress before start date', () => {
    const now = new Date('2024-01-09');
    vi.setSystemTime(now);

    const result = calculateBurndownProgress(
      '2024-01-10',
      '2024-01-20',
      mockTasks
    );

    expect(result.progress).toBe(0);
  });

  afterAll(() => {
    vi.useRealTimers();
  });
});
