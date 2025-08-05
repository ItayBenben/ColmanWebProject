import express from 'express';
import { auth } from '../middleware/auth.js';
import { createPost, getPost, updatePost, deletePost, listPosts, searchPosts, groupByGroup, groupByUser } from '../controllers/postController.js';

const router = express.Router();

router.post('/', auth, createPost);
router.get('/:postId', auth, getPost);
router.put('/:postId', auth, updatePost);
router.delete('/:postId', auth, deletePost);
router.get('/', auth, listPosts);
router.get('/search', auth, searchPosts);
router.get('/groupby/group', auth, groupByGroup);
router.get('/groupby/user', auth, groupByUser);

export default router; 