import { Router } from 'express';
import { categoryRoutes } from './category.controller.js';

const router = Router();

categoryRoutes(router);

export default router;
