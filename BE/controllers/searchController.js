import Post from '../models/Post.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

// Helper function to check if user can view a post
const canViewPost = (post, user) => {
  // Public posts can be viewed by anyone
  if (!post.group) return true;
  
  // Check if user is member of the group
  return post.group.members && post.group.members.includes(user._id);
};

// Helper function to check if user can view a group
const canViewGroup = (group, user) => {
  // Check if user is member of the group
  return group.members && group.members.includes(user._id);
};

// Helper function to check if user can view another user
const canViewUser = (targetUser, currentUser) => {

  return true;
};

export const searchAll = async (req, res) => {
  try {
    const { query, type } = req.query;
    const user = req.user;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    // Create case-insensitive regex pattern
    const searchRegex = new RegExp(query.trim(), 'i');
    const results = {};

    // Search posts if type is not specified or includes 'posts'
    if (!type || type.includes('posts')) {
      const posts = await Post.find({
        $or: [
          { content: searchRegex },
          { type: searchRegex }
        ]
      }).populate('author', 'username').populate('group', 'name members');

      // Filter posts based on permissions
      const filteredPosts = posts.filter(post => canViewPost(post, user));
      
      results.posts = filteredPosts.map(post => ({
        id: post._id,
        type: 'post',
        content: post.content,
        author: post.author.username,
        group: post.group ? post.group.name : null,
        createdAt: post.createdAt,
        likes: post.likes.length,
        comments: post.comments.length
      }));
    }

    // Search users if type is not specified or includes 'users'
    if (!type || type.includes('users')) {
      const users = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ]
      }).select('username email age gender createdAt');

      // Filter users based on permissions
      const filteredUsers = users.filter(targetUser => canViewUser(targetUser, user));
      
      results.users = filteredUsers.map(user => ({
        id: user._id,
        type: 'user',
        username: user.username,
        email: user.email,
        age: user.age,
        gender: user.gender,
        createdAt: user.createdAt
      }));
    }

    // Search groups if type is not specified or includes 'groups'
    if (!type || type.includes('groups')) {
      const groups = await Group.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      }).populate('members', 'username').populate('admin', 'username');

      // Filter groups based on permissions
      const filteredGroups = groups.filter(group => canViewGroup(group, user));
      
      results.groups = filteredGroups.map(group => ({
        id: group._id,
        type: 'group',
        name: group.name,
        description: group.description,
        admin: group.admin.username,
        memberCount: group.members.length,
        createdAt: group.createdAt
      }));
    }

    // Calculate total results
    const totalResults = (results.posts?.length || 0) + 
                        (results.users?.length || 0) + 
                        (results.groups?.length || 0);

    res.json({
      success: true,
      query: query.trim(),
      totalResults,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Error performing search',
      error: error.message 
    });
  }
};

// Search posts only
export const searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    const user = req.user;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const posts = await Post.find({
      $or: [
        { content: searchRegex },
        { type: searchRegex }
      ]
    }).populate('author', 'username').populate('group', 'name members');

    // Filter posts based on permissions
    const filteredPosts = posts.filter(post => canViewPost(post, user));
    
    const results = filteredPosts.map(post => ({
      id: post._id,
      type: 'post',
      content: post.content,
      author: post.author.username,
      group: post.group ? post.group.name : null,
      createdAt: post.createdAt,
      likes: post.likes.length,
      comments: post.comments.length
    }));

    res.json({
      success: true,
      query: query.trim(),
      totalResults: results.length,
      results
    });

  } catch (error) {
    console.error('Post search error:', error);
    res.status(500).json({ 
      message: 'Error searching posts',
      error: error.message 
    });
  }
};

// Search users only
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const user = req.user;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex }
      ]
    }).select('username email age gender createdAt');

    // Filter users based on permissions
    const filteredUsers = users.filter(targetUser => canViewUser(targetUser, user));
    
    const results = filteredUsers.map(user => ({
      id: user._id,
      type: 'user',
      username: user.username,
      email: user.email,
      age: user.age,
      gender: user.gender,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      query: query.trim(),
      totalResults: results.length,
      results
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ 
      message: 'Error searching users',
      error: error.message 
    });
  }
};

// Search groups only
export const searchGroups = async (req, res) => {
  try {
    const { query } = req.query;
    const user = req.user;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const groups = await Group.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).populate('members', 'username').populate('admin', 'username');

    // Filter groups based on permissions
    const filteredGroups = groups.filter(group => canViewGroup(group, user));
    
    const results = filteredGroups.map(group => ({
      id: group._id,
      type: 'group',
      name: group.name,
      description: group.description,
      admin: group.admin.username,
      memberCount: group.members.length,
      createdAt: group.createdAt
    }));

    res.json({
      success: true,
      query: query.trim(),
      totalResults: results.length,
      results
    });

  } catch (error) {
    console.error('Group search error:', error);
    res.status(500).json({ 
      message: 'Error searching groups',
      error: error.message 
    });
  }
}; 