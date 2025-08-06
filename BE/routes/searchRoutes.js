import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  searchAll, 
  searchPosts, 
  searchUsers, 
  searchGroups 
} from '../controllers/searchController.js';

const router = express.Router();

// Main search endpoint - searches across all types
router.get('/all', auth, searchAll);

// Specific search endpoints
router.get('/posts', auth, searchPosts);
router.get('/users', auth, searchUsers);
router.get('/groups', auth, searchGroups);

export default router; 