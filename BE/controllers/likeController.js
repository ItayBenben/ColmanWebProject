import Post from '../models/Post.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

// Like a post
export const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already liked the post
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    // Check authorization - user can like if:
    // 1. Post is in a group and user is a group member
    // 2. Post is public (no group) and user is friends with author or is the author
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
    } else {
      const author = await User.findById(post.author);
      if (!author.friends.includes(req.user._id) && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to like this post' });
      }
    }

    post.likes.push(req.user._id);
    await post.save();

    // Populate likes with user info
    const populatedPost = await Post.findById(postId)
      .populate('likes', 'username avatar')
      .populate('author', 'username');

    res.json({
      message: 'Post liked successfully',
      likesCount: populatedPost.likes.length,
      isLiked: true
    });
  } catch (err) {
    next(err);
  }
};

// Unlike a post
export const unlikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user has liked the post
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Post not liked' });
    }

    // Check authorization - user can unlike if they can like (same authorization rules)
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
    } else {
      const author = await User.findById(post.author);
      if (!author.friends.includes(req.user._id) && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to unlike this post' });
      }
    }

    post.likes.pull(req.user._id);
    await post.save();

    // Populate likes with user info
    const populatedPost = await Post.findById(postId)
      .populate('likes', 'username avatar')
      .populate('author', 'username');

    res.json({
      message: 'Post unliked successfully',
      likesCount: populatedPost.likes.length,
      isLiked: false
    });
  } catch (err) {
    next(err);
  }
};

// Toggle like (like if not liked, unlike if liked)
export const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
    } else {
      const author = await User.findById(post.author);
      if (!author.friends.includes(req.user._id) && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to interact with this post' });
      }
    }

    const isLiked = post.likes.includes(req.user._id);
    
    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }
    
    await post.save();

    // Populate likes with user info
    const populatedPost = await Post.findById(postId)
      .populate('likes', 'username avatar')
      .populate('author', 'username');

    res.json({
      message: isLiked ? 'Post unliked successfully' : 'Post liked successfully',
      likesCount: populatedPost.likes.length,
      isLiked: !isLiked
    });
  } catch (err) {
    next(err);
  }
};

// Get likes for a post
export const getLikes = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const post = await Post.findById(postId)
      .populate('likes', 'username avatar')
      .populate('author', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
    } else {
      const author = await User.findById(post.author);
      if (!author.friends.includes(req.user._id) && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this post' });
      }
    }

    // Paginate likes
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const likes = post.likes.slice(startIndex, endIndex);

    const result = {
      likes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(post.likes.length / limit),
        totalLikes: post.likes.length,
        hasNextPage: endIndex < post.likes.length,
        hasPrevPage: page > 1
      }
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Check if current user liked a post
export const checkLikeStatus = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
    } else {
      const author = await User.findById(post.author);
      if (!author.friends.includes(req.user._id) && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this post' });
      }
    }

    const isLiked = post.likes.includes(req.user._id);

    res.json({
      isLiked,
      likesCount: post.likes.length
    });
  } catch (err) {
    next(err);
  }
}; 