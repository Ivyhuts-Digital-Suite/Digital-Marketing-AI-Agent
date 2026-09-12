import { Request, Response } from 'express';
import { StrategyAgent } from '../modules/strategy/strategy.agent';
import { StrategyBrief } from '../modules/strategy/strategy.types';
import { StrategyVersionModel } from '../modules/strategy/strategy.schema';

const strategyAgent = new StrategyAgent();

export const generateStrategyHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const brief: StrategyBrief = req.body;
    const incomingId = (req.body?.strategyId || req.query?.strategyId) as string | undefined;


    if (!brief || !brief.organizationId || !brief.goals) {
      res.status(400).json({ error: 'organizationId and goals are required in strategy brief' });
      return;
    }

    const strategy = await strategyAgent.execute(brief, incomingId);
    res.status(200).json({ success: true, data: strategy });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getStrategyHistoryHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const history = await StrategyVersionModel.find({ strategyId }).sort({ version: 1 }).lean();
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};