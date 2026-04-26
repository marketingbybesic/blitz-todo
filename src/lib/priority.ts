import type { Task } from '../types';

export function calculatePriority(task: Task): number {
  const impactScore =
    task.impact === 'high' ? 100 : task.impact === 'medium' ? 50 : 10;

  let urgencyScore = 0;

  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      urgencyScore = 500; // Overdue
    } else if (diffHours <= 24) {
      urgencyScore = 200; // Due within 24h
    }
  }

  return impactScore + urgencyScore;
}
