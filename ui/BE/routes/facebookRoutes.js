import express from 'express';
import { auth } from '../middleware/auth.js';
import { createFacebookPost } from '../controllers/facebookController.js';

const router = express.Router();

router.post('/', auth, createFacebookPost);

export default router;
