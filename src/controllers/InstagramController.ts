import { Request, Response } from 'express';
import { z } from 'zod';
import { InstagramService } from '../services/InstagramService';
import { ProgressService } from '../services/ProgressService';
import logger from '../utils/logger';

const instagramService = new InstagramService();
const progressService = ProgressService.getInstance();

const followerRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
  targetProfile: z.string(),
});

const closeFriendsRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
  followers: z.array(z.string()),
});

const analyticsRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export class InstagramController {
  async getFollowers(req: Request, res: Response): Promise<void> {
    try {
      const validation = followerRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        logger.warn('Invalid request data for getFollowers', { 
          errors: validation.error.format() 
        });
        res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format() 
        });
        return;
      }

      const { username, password, targetProfile } = validation.data;

      const followers = await instagramService.getFollowers(
        username,
        password,
        targetProfile
      );

      res.json({ success: true, followers });
    } catch (error) {
      logger.error('Error in getFollowers controller', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addToCloseFriends(req: Request, res: Response): Promise<void> {
    try {
      const validation = closeFriendsRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        logger.warn('Invalid request data for addToCloseFriends', { 
          errors: validation.error.format() 
        });
        res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format() 
        });
        return;
      }

      const { username, password, followers } = validation.data;

      const taskId = await instagramService.addToCloseFriends(username, password, followers);

      res.json({ 
        success: true, 
        message: 'Close friends addition process started',
        taskId
      });
    } catch (error) {
      logger.error('Error in addToCloseFriends controller', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProfileAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const validation = analyticsRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        logger.warn('Invalid request data for getProfileAnalytics', { 
          errors: validation.error.format() 
        });
        res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format() 
        });
        return;
      }

      const { username, password } = validation.data;

      const analytics = await instagramService.getProfileAnalytics(username, password);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getProfileAnalytics controller', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProcessStatus(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const progress = progressService.getProgress(taskId);

      if (!progress) {
        res.status(404).json({ 
          error: 'Process not found',
          message: 'No process found with the provided task ID'
        });
        return;
      }

      res.json({ success: true, progress });
    } catch (error) {
      logger.error('Error getting process status', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}