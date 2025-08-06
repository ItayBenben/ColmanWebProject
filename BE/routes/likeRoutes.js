import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  likePost, 
  unlikePost, 
  toggleLike, 
  getLikes, 
  checkLikeStatus,
  toggleCommentLike
} from '../controllers/likeController.js';

const router = express.Router();

// Like a post
router.post('/posts/:postId/like', auth, likePost);

// Unlike a post
router.delete('/posts/:postId/like', auth, unlikePost);

// Toggle like (like if not liked, unlike if liked)
router.patch('/posts/:postId/like', auth, toggleLike);

// Get likes for a post (with pagination)
router.get('/posts/:postId/likes', auth, getLikes);

// Check if current user liked a post
router.get('/posts/:postId/like/status', auth, checkLikeStatus);

// Comment like routes
router.patch('/posts/:postId/comments/:commentId/like', auth, toggleCommentLike);

export default router; 