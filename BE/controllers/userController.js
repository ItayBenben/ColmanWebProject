import User from '../models/User.js';
import Group from '../models/Group.js';
import Post from '../models/Post.js';

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('friends', 'username email')
      .populate('groups', 'name description admin')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Allow users to view their own profile or friends' profiles
    if (req.params.id === req.user._id.toString() || req.user.friends.includes(req.params.id)) {
      res.json(user);
    } else {
      // Return limited info for non-friends
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email
      });
    }
  } catch (err) {
    next(err);
  }
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

export const addFriend = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot friend yourself' });
    
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: 'Current user not found' });
    
    // Check if already friends
    if (currentUser.friends.includes(userId)) return res.status(400).json({ message: 'Already friends' });
    if (targetUser.friends.includes(req.user._id)) return res.status(400).json({ message: 'Already friends' });
    
    // Check if user is blocked
    if (currentUser.blockedUsers.includes(userId) || targetUser.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Cannot add blocked user as friend' });
    }
    
    // Add mutual friendship - both users become friends
    currentUser.friends.push(userId);
    targetUser.friends.push(req.user._id);
    
    // Remove any existing friend requests between users
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== userId);
    targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== req.user._id.toString());
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({ 
      message: 'Friend added successfully',
      friend: {
        _id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email
      }
    });
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