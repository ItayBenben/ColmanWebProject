import Post from '../models/Post.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

export const getFeed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends').populate('groups');
    const friendIds = user.friends.map(f => f._id);
    const groupIds = user.groups.map(g => g._id);
    const posts = await Post.find({
      $and: [
        { group: null }, // Only public posts (not in any group)
        {
          $or: [
            { author: { $in: friendIds } }, // Friends' public posts
            { author: req.user._id }        // Your own public posts
          ]
        }
      ]
    })
    .populate('author', 'username')
    .populate('likes', 'username')
    .populate('comments.user', 'username')
    .populate('group', 'name')
    .sort({ createdAt: -1 });
    
    // Transform posts to match frontend expectations
    const transformedPosts = posts.map(post => ({
      ...post.toObject(),
      owner: { name: post.author.username }, // Add owner field for frontend
      _id: post._id,
      content: post.content,
      type: post.type,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
    
    res.json(transformedPosts);
  } catch (err) {
    next(err);
  }
}; 