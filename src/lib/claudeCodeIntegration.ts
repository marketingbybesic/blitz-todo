// src/lib/claudeCodeIntegration.ts
// Claude Code integration — exposes a local API for the Claude Code agent to add tasks
// The agent can use BroadcastChannel('blitz-agent-bridge') to communicate

import { db } from './db';
import type { Task } from '../types/index';

let serverStarted = false;

export async function startClaudeCodeBridge(): Promise<void> {
  if (serverStarted) return;

  // Only run in Tauri context — in web mode expose via window object
  if (!('__TAURI_INTERNALS__' in window)) {
    (window as unknown as Record<string, unknown>).__blitz_add_task = addTaskFromAgent;
    console.log('[Blitz] Claude Code bridge active via window.__blitz_add_task');
    return;
  }

  try {
    const channel = new BroadcastChannel('blitz-agent-bridge');
    channel.addEventListener('message', async (e: MessageEvent) => {
      if (e.data?.type === 'ADD_TASK' && e.data?.task) {
        try {
          const result = await addTaskFromAgent(e.data.task as AgentTaskInput);
          channel.postMessage({ type: 'TASK_ADDED', id: result, success: true });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          channel.postMessage({ type: 'ERROR', error: msg });
        }
      }
      if (e.data?.type === 'LIST_TASKS') {
        const tasks = await db.tasks.toArray();
        channel.postMessage({ type: 'TASK_LIST', tasks });
      }
    });
    serverStarted = true;
    console.log('[Blitz] Claude Code bridge active via BroadcastChannel');
  } catch (e) {
    console.warn('[Blitz] Could not start agent bridge:', e);
  }
}

interface AgentTaskInput {
  title: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  estimatedMinutes?: number;
  energyLevel?: 'deep-work' | 'light-work';
  zoneId?: string;
  content?: string;
}

export async function addTaskFromAgent(taskData: AgentTaskInput): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const task: Task = {
    id,
    title: taskData.title,
    status: 'todo',
    impact: taskData.priority ?? 'medium',
    energyLevel: taskData.energyLevel ?? 'light-work',
    estimatedMinutes: taskData.estimatedMinutes ?? 25,
    isTarget: false,
    dueDate: taskData.dueDate,
    content: taskData.content,
    zoneId: taskData.zoneId,
    startDate: undefined,
    checklist: [],
    timeTracked: 0,
    createdAt: now,
  };

  await db.tasks.add(task);
  return id;
}

// Helper for Claude Code agent to use from terminal:
// BroadcastChannel is only available in browser/webview context.
// Use window.__blitz_add_task in web mode, or postMessage via BroadcastChannel in Tauri.
export const CLAUDE_CODE_INSTRUCTIONS = `
# Claude Code → Blitz Integration

To add tasks from Claude Code (Blitz must be running):

## Via BroadcastChannel (Tauri / desktop):
\`\`\`javascript
const ch = new BroadcastChannel('blitz-agent-bridge');
ch.postMessage({
  type: 'ADD_TASK',
  task: { title: 'Review PR #42', priority: 'high', estimatedMinutes: 30 }
});
\`\`\`

## Via window (web mode):
\`\`\`javascript
window.__blitz_add_task({ title: 'My task', priority: 'high' });
\`\`\`

## List existing tasks:
\`\`\`javascript
const ch = new BroadcastChannel('blitz-agent-bridge');
ch.postMessage({ type: 'LIST_TASKS' });
ch.addEventListener('message', e => {
  if (e.data.type === 'TASK_LIST') console.log(e.data.tasks);
});
\`\`\`
`;
