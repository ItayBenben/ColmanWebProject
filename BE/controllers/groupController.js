import Group from '../models/Group.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

export const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = new Group({ name, description, admin: req.user._id, members: [req.user._id] });
    await group.save();
    
    // Use findByIdAndUpdate to avoid validation issues
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { groups: group._id } }
    );
    
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.includes(req.user._id)) return res.status(400).json({ message: 'Already a member' });
    group.members.push(req.user._id);
    await group.save();
    
    // Use findByIdAndUpdate to avoid validation issues
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { groups: group._id } }
    );
    
    res.json({ message: 'Joined group' });
  } catch (err) {
    next(err);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Remove user from group members
    group.members = group.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    await group.save();
    
    // Use findByIdAndUpdate to avoid validation issues
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { groups: id } }
    );
    
    res.json({ message: 'Left group' });
  } catch (err) {
    next(err);
  }
};

export const getGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id)
      .populate('members', 'username email')
      .populate('admin', 'username email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
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
    const { id } = req.params;
    const group = await Group.findById(id);
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

// Add member to group (any group member can add new members)
export const addMemberToGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if current user is a member of the group
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be a group member to add others' });
    }

    // Check if user to be added exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add user to group members
    group.members.push(userId);
    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(
      userId,
      { $push: { groups: group._id } }
    );

    res.json({ message: 'Member added successfully' });
  } catch (err) {
    next(err);
  }
};

// Remove member from group (admin only)
export const removeMemberFromGroup = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if current user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can remove members' });
    }

    // Cannot remove admin
    if (userId === group.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove group admin' });
    }

    // Remove user from group members
    group.members = group.members.filter(memberId => memberId.toString() !== userId);
    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(
      userId,
      { $pull: { groups: group._id } }
    );

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
}; 