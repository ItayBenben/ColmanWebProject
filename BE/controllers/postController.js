import Post from '../models/Post.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

export const createPost = async (req, res, next) => {
  try {
    const { content, type, files, groupId } = req.body;
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
    const post = await Post.findById(req.params.postId).populate('author', 'username').populate('group', 'name');
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
    const post = await Post.findById(req.params.postId);
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
    const post = await Post.findById(req.params.postId);
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
      posts = await Post.find({ group: req.query.groupId });
    } else if (req.query.userId) {
      if (req.query.userId !== req.user._id.toString() && !req.user.friends.includes(req.query.userId)) {
        return res.status(403).json({ message: 'Not a friend' });
      }
      posts = await Post.find({ author: req.query.userId });
    } else {
      posts = await Post.find({ author: req.user._id });
    }
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