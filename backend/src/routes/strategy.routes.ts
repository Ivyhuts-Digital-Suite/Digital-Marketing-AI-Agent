import { Router } from 'express';
import {
  generateStrategyHandler,
  getStrategyHistoryHandler,
} from '../controllers/strategy.controller';

const router = Router();

router.post('/generate', generateStrategyHandler);
router.get('/history/:strategyId', getStrategyHistoryHandler);

export default router;