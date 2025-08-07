import express from 'express';
import { auth } from '../middleware/auth.js';
import { createPost, getPost, updatePost, deletePost, listPosts, searchPosts, groupByGroup, groupByUser } from '../controllers/postController.js';

const router = express.Router();

router.get('/search', auth, searchPosts);
router.get('/', auth, listPosts);
router.post('/', auth, createPost);
router.get('/:id', auth, getPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.get('/group/:groupId', auth, groupByGroup);
router.get('/user/:userId', auth, groupByUser);

export default router; 