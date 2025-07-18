import Post from '../models/Post.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

export const getFeed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends').populate('groups');
    const friendIds = user.friends.map(f => f._id);
    const groupIds = user.groups.map(g => g._id);
    const posts = await Post.find({
      $or: [
        { author: { $in: friendIds } },
        { group: { $in: groupIds } },
        { author: req.user._id }
      ]
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
}; 