export interface ProgressUpdate {
  taskId: string;
  type: 'close-friends';
  status: 'in-progress' | 'completed' | 'error';
  currentItem?: string;
  totalItems: number;
  processedItems: number;
  error?: string;
  timestamp: number;
}