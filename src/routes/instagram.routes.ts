import { Router } from 'express';
import { InstagramController } from '../controllers/InstagramController';
import asyncHandler from 'express-async-handler';

const router = Router();
const instagramController = new InstagramController();

router.post(
  '/followers',
  asyncHandler((req, res) => instagramController.getFollowers(req, res))
);

router.post(
  '/close-friends',
  asyncHandler((req, res) => instagramController.addToCloseFriends(req, res))
);

router.get(
  '/process/:taskId',
  asyncHandler((req, res) => instagramController.getProcessStatus(req, res))
);

router.post(
  '/analytics',
  asyncHandler((req, res) => instagramController.getProfileAnalytics(req, res))
);

export default router;