import Post from '../models/Post.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

export const createPost = async (req, res, next) => {
  try {
    const { content, type, files, group: groupId } = req.body;
    let group = null;
    if (groupId) {
      group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      if (!group.members.includes(req.user._id)) return res.status(403).json({ message: 'Not a group member' });
    }
    const post = new Post({
      author: req.user._id,
      group: groupId,
      content,
      type,
      files: files || []
    });
    await post.save();
    if (group) {
      group.posts.push(post._id);
      await group.save();
    }
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username').populate('group', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group.members.includes(req.user._id)) return res.status(403).json({ message: 'Not a group member' });
    } else {
      const author = await User.findById(post.author);
      if (!author.friends.includes(req.user._id) && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not a friend' });
      }
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not post owner' });
    Object.assign(post, req.body);
    post.updatedAt = Date.now();
    await post.save();
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not post owner' });
    if (post.group) {
      await Group.updateOne(
        { _id: post.group },
        { $pull: { posts: post._id } }
      );
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

export const listPosts = async (req, res, next) => {
  try {
    let posts;
    if (req.query.groupId) {
      const group = await Group.findById(req.query.groupId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      if (!group.members.includes(req.user._id)) return res.status(403).json({ message: 'Not a group member' });
      posts = await Post.find({ group: req.query.groupId })
        .populate('author', 'username')
        .populate('likes', 'username')
        .populate('comments.user', 'username')
        .populate('comments.likes', 'username')
        .populate('group', 'name')
        .sort({ createdAt: -1 });
    } else if (req.query.userId) {
      // Get authorized posts for a specific user
      posts = await getAuthorizedUserPosts(req.query.userId, req.user._id);
    } else {
      posts = await Post.find({ author: req.user._id })
        .populate('author', 'username')
        .populate('likes', 'username')
        .populate('comments.user', 'username')
        .populate('comments.likes', 'username')
        .populate('group', 'name')
        .sort({ createdAt: -1 });
    }
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// Helper function to get authorized posts for a user
async function getAuthorizedUserPosts(targetUserId, currentUserId) {
  // If viewing own posts, show all
  if (targetUserId.toString() === currentUserId.toString()) {
    return await Post.find({ author: targetUserId })
      .populate('author', 'username')
      .populate('likes', 'username')
      .populate('comments.user', 'username')
      .populate('comments.likes', 'username')
      .populate('group', 'name')
      .sort({ createdAt: -1 });
  }

  // Get current user's groups and friends
  const currentUser = await User.findById(currentUserId);
  const userGroups = currentUser.groups || [];
  const userFriends = currentUser.friends || [];

  // Check if target user is a friend
  const isFriend = userFriends.includes(targetUserId);

  // Build query for authorized posts
  const authorizedPosts = [];

  // Get posts by target user
  const targetUserPosts = await Post.find({ author: targetUserId })
    .populate('author', 'username')
    .populate('likes', 'username')
    .populate('comments.user', 'username')
    .populate('comments.likes', 'username')
    .populate('group', 'name')
    .sort({ createdAt: -1 });

  // Filter posts based on authorization
  for (const post of targetUserPosts) {
    let isAuthorized = false;

    // Own posts are always authorized
    if (post.author._id.toString() === currentUserId.toString()) {
      isAuthorized = true;
    }
    // Public posts (no group) are authorized if friends
    else if (!post.group && isFriend) {
      isAuthorized = true;
    }
    // Group posts are authorized if both users are in the same group
    else if (post.group && userGroups.includes(post.group._id)) {
      isAuthorized = true;
    }

    if (isAuthorized) {
      authorizedPosts.push(post);
    }
  }

  return authorizedPosts;
}

export const searchPosts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const posts = await Post.find({ content: { $regex: q, $options: 'i' } })
      .populate('author', 'username')
      .populate('likes', 'username')
      .populate('comments.user', 'username')
      .populate('comments.likes', 'username')
      .populate('group', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export const groupByGroup = async (req, res, next) => {
  try {
    const result = await Post.aggregate([
      { $match: { group: { $ne: null } } },
      { $group: { _id: '$group', count: { $sum: 1 } } }
    ]);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const groupByUser = async (req, res, next) => {
  try {
    const result = await Post.aggregate([
      { $group: { _id: '$author', count: { $sum: 1 } } }
    ]);
    res.json(result);
  } catch (err) {
    next(err);
  }
}; 