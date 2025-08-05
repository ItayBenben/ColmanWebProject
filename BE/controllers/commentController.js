import Post from '../models/Post.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

// Add a comment to a post
export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization - user can comment if:
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
        return res.status(403).json({ message: 'Not authorized to comment on this post' });
      }
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate user info for the new comment
    const populatedPost = await Post.findById(postId)
      .populate('comments.user', 'username avatar')
      .populate('author', 'username');

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
};

// Edit a comment
export const editComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the comment author can edit their comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await post.save();

    // Populate user info
    const populatedPost = await Post.findById(postId)
      .populate('comments.user', 'username avatar')
      .populate('author', 'username');

    const updatedComment = populatedPost.comments.id(commentId);

    res.json(updatedComment);
  } catch (err) {
    next(err);
  }
};

// Delete a comment
export const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Comment author or post author can delete the comment
    if (comment.user.toString() !== req.user._id.toString() && 
        post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments.pull(commentId);
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get comments for a post
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const post = await Post.findById(postId)
      .populate('comments.user', 'username avatar')
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

    // Paginate comments
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const comments = post.comments.slice(startIndex, endIndex);

    const result = {
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(post.comments.length / limit),
        totalComments: post.comments.length,
        hasNextPage: endIndex < post.comments.length,
        hasPrevPage: page > 1
      }
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
}; 