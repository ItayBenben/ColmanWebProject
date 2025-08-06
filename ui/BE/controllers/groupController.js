import Group from '../models/Group.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

export const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = new Group({ name, description, admin: req.user._id, members: [req.user._id] });
    await group.save();
    req.user.groups.push(group._id);
    await req.user.save();
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.includes(req.user._id)) return res.status(400).json({ message: 'Already a member' });
    group.members.push(req.user._id);
    await group.save();
    req.user.groups.push(group._id);
    await req.user.save();
    res.json({ message: 'Joined group' });
  } catch (err) {
    next(err);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.members = group.members.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
    req.user.groups = req.user.groups.filter(id => id.toString() !== groupId);
    await req.user.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not group admin' });
    Object.assign(group, req.body);
    await group.save();
    res.json(group);
  } catch (err) {
    next(err);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not group admin' });
    // Remove group from all users' groups arrays
    await User.updateMany(
      { groups: group._id },
      { $pull: { groups: group._id } }
    );
    // Delete all posts in the group
    await Post.deleteMany({ group: group._id });
    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
};

export const listGroups = async (req, res, next) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

export const searchGroups = async (req, res, next) => {
  try {
    const { q } = req.query;
    const groups = await Group.find({ name: { $regex: q, $options: 'i' } });
    res.json(groups);
  } catch (err) {
    next(err);
  }
}; 