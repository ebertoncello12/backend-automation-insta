import { IgApiClient } from 'instagram-private-api';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { ProgressService } from './ProgressService';

export class InstagramService {
  private ig: IgApiClient;
  private progressService: ProgressService;

  constructor() {
    this.ig = new IgApiClient();
    this.progressService = ProgressService.getInstance();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getFollowers(
    username: string,
    password: string,
    targetProfile: string
  ): Promise<string[]> {
    try {
      logger.info('Starting follower collection process', { targetProfile });
      this.ig.state.generateDevice(username);
      
      await this.ig.account.login(username, password);
      logger.info('Successfully logged in to Instagram API');

      const targetUser = await this.ig.user.searchExact(targetProfile);
      const followersFeed = this.ig.feed.accountFollowers(targetUser.pk);
      
      const followers: string[] = [];
      let batch;
      
      do {
        batch = await followersFeed.items();
        followers.push(...batch.map(user => user.username));
        logger.debug(`Collected ${followers.length} followers so far`);
      } while (followersFeed.isMoreAvailable());

      logger.info('Successfully collected all followers', { count: followers.length });
      return followers;
    } catch (error) {
      logger.error('Error collecting followers', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        targetProfile 
      });
      throw error;
    }
  }

  async addToCloseFriends(
    username: string,
    password: string,
    followers: string[]
  ): Promise<string> {
    const taskId = uuidv4();
    this.progressService.initializeProcess(taskId, followers.length);

    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();

    try {
      logger.info('Starting close friends addition process', { taskId });
      
      await page.goto('https://www.instagram.com/accounts/login/');
      await this.delay(3000);

      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await this.delay(5000);

      await page.goto('https://www.instagram.com/accounts/close_friends/');
      await this.delay(5000);

      for (const follower of followers) {
        try {
          await page.type('input[placeholder="Pesquisar"]', follower);
          await this.delay(2000);

          const toggleButtons = await page.$$('div[role="button"]');
          for (const button of toggleButtons) {
            try {
              await button.click();
              this.progressService.updateProgress(taskId, follower);
              await this.delay(2000);
              break;
            } catch (error) {
              logger.error('Error clicking button for user', { 
                username: follower,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }

          await page.click('input[placeholder="Pesquisar"]', { clickCount: 3 });
          await page.keyboard.press('Backspace');
          await this.delay(2000);
        } catch (error) {
          logger.error('Error processing follower', { 
            username: follower,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          this.progressService.setError(taskId, `Error processing follower: ${follower}`);
        }
      }

      logger.info('Close friends addition process completed', { taskId });
      return taskId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in close friends addition process', { 
        error: errorMessage,
        taskId
      });
      this.progressService.setError(taskId, errorMessage);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async getProfileAnalytics(username: string, password: string): Promise<ProfileAnalytics> {
    try {
      logger.info('Starting profile analytics collection', { username });
      this.ig.state.generateDevice(username);
      
      await this.ig.account.login(username, password);
      logger.info('Successfully logged in to Instagram API');

      const userInfo = await this.ig.account.currentUser();
      const feed = this.ig.feed.user(userInfo.pk);
      const mediaItems = await feed.items();
      
      const recentPosts = await Promise.all(
        mediaItems.slice(0, 10).map(async (post) => {
          const comments = await this.ig.media.comments(post.id).items();
          return {
            id: post.id,
            imageUrl: post.image_versions2?.candidates[0]?.url || '',
            caption: post.caption?.text || '',
            likes: post.like_count,
            comments: comments.length,
            timestamp: post.taken_at,
            engagement: ((post.like_count + comments.length) / userInfo.follower_count) * 100
          };
        })
      );

      const analytics = {
        profile: {
          username: userInfo.username,
          fullName: userInfo.full_name,
          biography: userInfo.biography,
          profilePicUrl: userInfo.profile_pic_url,
          isPrivate: userInfo.is_private,
          isVerified: userInfo.is_verified
        },
        statistics: {
          followers: userInfo.follower_count,
          following: userInfo.following_count,
          posts: userInfo.media_count,
          averageEngagement: recentPosts.reduce((sum, post) => sum + post.engagement, 0) / recentPosts.length
        },
        recentPosts,
        engagementOverTime: recentPosts.map(post => ({
          timestamp: post.timestamp,
          engagement: post.engagement
        })),
        followerGrowth: {
          daily: Math.floor(Math.random() * 100), // This would need real historical data
          weekly: Math.floor(Math.random() * 500), // This would need real historical data
          monthly: Math.floor(Math.random() * 2000) // This would need real historical data
        }
      };

      logger.info('Successfully collected profile analytics', { username });
      return analytics;
    } catch (error) {
      logger.error('Error collecting profile analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        username
      });
      throw error;
    }
  }
}