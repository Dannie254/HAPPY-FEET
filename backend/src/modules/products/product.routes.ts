import { Router } from 'express';
import { productRoutes } from './product.controller.js';

const router = Router();

productRoutes(router);

export default router;
