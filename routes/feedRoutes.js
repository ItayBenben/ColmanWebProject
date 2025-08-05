import express from 'express';
import { auth } from '../middleware/auth.js';
import { getFeed } from '../controllers/feedController.js';

const router = express.Router();

router.get('/', auth, getFeed);

export default router; 