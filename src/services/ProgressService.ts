import { Server as SocketServer } from 'socket.io';
import { ProgressUpdate } from '../types/progress';
import logger from '../utils/logger';

export class ProgressService {
  private static instance: ProgressService;
  private io: SocketServer | null = null;
  private activeProcesses: Map<string, ProgressUpdate> = new Map();

  private constructor() {}

  static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  setSocketServer(io: SocketServer): void {
    this.io = io;
  }

  initializeProcess(taskId: string, totalItems: number): void {
    const initialProgress: ProgressUpdate = {
      taskId,
      type: 'close-friends',
      status: 'in-progress',
      totalItems,
      processedItems: 0,
      timestamp: Date.now()
    };

    this.activeProcesses.set(taskId, initialProgress);
    this.emitUpdate(initialProgress);
    logger.info('Process initialized', { taskId, totalItems });
  }

  updateProgress(taskId: string, currentItem: string): void {
    const process = this.activeProcesses.get(taskId);
    
    if (!process) return;

    const updatedProgress: ProgressUpdate = {
      ...process,
      currentItem,
      processedItems: process.processedItems + 1,
      timestamp: Date.now()
    };

    if (updatedProgress.processedItems === updatedProgress.totalItems) {
      updatedProgress.status = 'completed';
    }

    this.activeProcesses.set(taskId, updatedProgress);
    this.emitUpdate(updatedProgress);
    logger.debug('Progress updated', { 
      taskId, 
      current: currentItem,
      processed: updatedProgress.processedItems,
      total: updatedProgress.totalItems 
    });
  }

  setError(taskId: string, error: string): void {
    const process = this.activeProcesses.get(taskId);
    if (!process) return;

    const errorUpdate: ProgressUpdate = {
      ...process,
      status: 'error',
      error,
      timestamp: Date.now()
    };

    this.activeProcesses.set(taskId, errorUpdate);
    this.emitUpdate(errorUpdate);
    logger.error('Process error', { taskId, error });
  }

  getProgress(taskId: string): ProgressUpdate | undefined {
    return this.activeProcesses.get(taskId);
  }

  private emitUpdate(update: ProgressUpdate): void {
    if (this.io) {
      console.log(update)
      this.io.emit('progress:update', update);
      logger.debug('Progress update emitted', { taskId: update.taskId });
    }
  }
}