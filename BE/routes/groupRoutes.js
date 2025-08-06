import express from 'express';
import { auth } from '../middleware/auth.js';
import { createGroup, joinGroup, leaveGroup, updateGroup, deleteGroup, listGroups, searchGroups, getGroup } from '../controllers/groupController.js';

const router = express.Router();

router.get('/search', auth, searchGroups);
router.get('/', auth, listGroups);
router.post('/', auth, createGroup);
router.get('/:id', auth, getGroup);
router.put('/:id', auth, updateGroup);
router.delete('/:id', auth, deleteGroup);
router.post('/:id/join', auth, joinGroup);
router.post('/:id/leave', auth, leaveGroup);

export default router; 