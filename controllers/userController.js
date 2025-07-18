import User from '../models/User.js';
import Group from '../models/Group.js';
import Post from '../models/Post.js';

export const getUser = async (req, res, next) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(req.user);
};

export const updateUser = async (req, res, next) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    // Remove user from all groups' members arrays
    await Group.updateMany(
      { members: req.user._id },
      { $pull: { members: req.user._id } }
    );
    // Remove user from all users' friends, friendRequests, and blockedUsers arrays
    await User.updateMany(
      {},
      {
        $pull: {
          friends: req.user._id,
          friendRequests: req.user._id,
          blockedUsers: req.user._id
        }
      }
    );
    // Delete all posts by the user
    await Post.deleteMany({ author: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await User.find({ username: { $regex: q, $options: 'i' } }).select('username email');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const sendFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot friend yourself' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.friendRequests.includes(req.user._id)) return res.status(400).json({ message: 'Already requested' });
    user.friendRequests.push(req.user._id);
    await user.save();
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    next(err);
  }
};

export const approveFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.friendRequests.includes(userId)) return res.status(400).json({ message: 'No such request' });
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userId);
    user.friends.push(userId);
    await user.save();
    const friend = await User.findById(userId);
    friend.friends.push(req.user._id);
    await friend.save();
    res.json({ message: 'Friend request approved' });
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot block yourself' });
    const user = await User.findById(req.user._id);
    if (user.blockedUsers.includes(userId)) return res.status(400).json({ message: 'Already blocked' });
    user.blockedUsers.push(userId);
    await user.save();
    res.json({ message: 'User blocked' });
  } catch (err) {
    next(err);
  }
}; 