import express from 'express';
import { auth } from '../middleware/auth.js';
import { createGroup, joinGroup, leaveGroup, updateGroup, deleteGroup, listGroups, searchGroups } from '../controllers/groupController.js';

const router = express.Router();

router.post('/', auth, createGroup);
router.post('/join', auth, joinGroup);
router.post('/leave', auth, leaveGroup);
router.put('/:groupId', auth, updateGroup);
router.delete('/:groupId', auth, deleteGroup);
router.get('/', auth, listGroups);
router.get('/search', auth, searchGroups);

export default router; 