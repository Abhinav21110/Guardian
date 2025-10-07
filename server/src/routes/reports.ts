import { Router } from 'express';

export const reportsRouter = Router();

reportsRouter.get('/', async (req, res) => {
  res.json({ reports: [] });
});
