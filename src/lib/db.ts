import Dexie, { Table } from 'dexie';
import type { Task, Zone } from '../types/index';

class BlitzDB extends Dexie {
  tasks!: Table<Task>;
  zones!: Table<Zone>;

  constructor() {
    super('BlitzDB');

    this.version(1).stores({
      tasks: 'id, zoneId, isTarget, energyLevel, startDate, dueDate, impact, status',
      zones: 'id',
    });
  }
}

export const db = new BlitzDB();
