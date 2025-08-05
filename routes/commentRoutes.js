import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  addComment, 
  editComment, 
  deleteComment, 
  getComments 
} from '../controllers/commentController.js';

const router = express.Router();

// Add a comment to a post
router.post('/posts/:postId/comments', auth, addComment);

// Edit a comment
router.put('/posts/:postId/comments/:commentId', auth, editComment);

// Delete a comment
router.delete('/posts/:postId/comments/:commentId', auth, deleteComment);

// Get comments for a post (with pagination)
router.get('/posts/:postId/comments', auth, getComments);

export default router; 