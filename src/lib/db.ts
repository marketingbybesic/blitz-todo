import Dexie, { Table } from 'dexie';
import type { Task, Zone, Reflection } from '../types/index';

class BlitzDB extends Dexie {
  tasks!: Table<Task>;
  zones!: Table<Zone>;
  reflections!: Table<Reflection>;

  constructor() {
    super('BlitzDB');

    this.version(2).stores({
      tasks: 'id, zoneId, isTarget, energyLevel, startDate, dueDate, impact, status',
      zones: 'id',
      reflections: 'id, date',
    });

    this.version(3).stores({
      tasks: 'id, zoneId, isTarget, energyLevel, startDate, dueDate, impact, status',
      zones: 'id',
      reflections: 'id, date',
    }).upgrade(tx => {
      return tx.table('tasks').toCollection().modify(task => {
        if (task.timeTracked === undefined) task.timeTracked = 0;
      });
    });
  }
}

export const db = new BlitzDB();
