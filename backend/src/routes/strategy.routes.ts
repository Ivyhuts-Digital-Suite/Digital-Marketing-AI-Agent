import { Router } from 'express';
import {
  generateStrategyHandler,
  getStrategyHistoryHandler,
} from '../controllers/strategy.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/generate', authenticate, generateStrategyHandler);
router.get('/history/:strategyId', authenticate, getStrategyHistoryHandler);

export default router;