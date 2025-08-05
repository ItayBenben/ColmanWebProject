import express from 'express';
import { auth } from '../middleware/auth.js';
import { getUser, updateUser, deleteUser, searchUsers, sendFriendRequest, approveFriendRequest, blockUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', auth, getUser);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.get('/search', auth, searchUsers);
router.post('/friend-request', auth, sendFriendRequest);
router.post('/approve-friend', auth, approveFriendRequest);
router.post('/block', auth, blockUser);

export default router; 