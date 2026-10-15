import { Router } from 'express';
import { searchRoutes } from './search.controller.js';

const router = Router();

searchRoutes(router);

export default router;
