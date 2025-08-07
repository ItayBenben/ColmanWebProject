import express from 'express';
import { auth } from '../middleware/auth.js';
import { getUser, updateUser, deleteUser, searchUsers, addFriend, approveFriendRequest, blockUser, getUserStatistics } from '../controllers/userController.js';

const router = express.Router();

router.get('/search', auth, searchUsers);
router.get('/:id/statistics', auth, getUserStatistics);
router.get('/:id', auth, getUser);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.post('/add-friend', auth, addFriend);
router.post('/approve-friend', auth, approveFriendRequest);
router.post('/block', auth, blockUser);

export default router; 