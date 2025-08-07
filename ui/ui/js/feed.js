function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

const token = localStorage.getItem('jwt');

// Check if user is authenticated
function checkAuth() {
if (!token) {
  console.log('No token found, redirecting to login');
  window.location.href = 'login.html';
  return false;
}
return true;
}

async function fetchFeed() {
if (!checkAuth()) return;

try {
  const res = await fetch("http://localhost:5000/api/feed/", {
    headers: { "Authorization": `Bearer ${token}` },
    credentials: 'include'
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      console.log('Token expired, redirecting to login');
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  const posts = await res.json();
  
  // Store all posts for filtering
  if (typeof window.allPosts !== 'undefined') {
    window.allPosts = posts;
    if (typeof window.displayPosts === 'function') {
      window.displayPosts(posts);
    } else {
      // Fallback to original display method
      displayPostsDirectly(posts);
    }
  } else {
    // Fallback to original display method
    displayPostsDirectly(posts);
  }
} catch (error) {
  console.error('Error fetching feed:', error);
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
}
}

// Fallback function for displaying posts (original method)
function displayPostsDirectly(posts) {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  if (posts.length === 0) {
    postsContainer.innerHTML = '<p>No posts available. Be the first to post!</p>';
    return;
  }

  posts.forEach(post => {
    const postEl = document.createElement("div");
    postEl.className = "post";

    // Handle media display
    let mediaContent = '';
    if (post.files && post.files.length > 0) {
      post.files.forEach(file => {
        if (file.fileType === 'image') {
          mediaContent += `<img src="${file.url}" alt="Post image" style="max-width: 100%; height: auto;" />`;
        } else if (file.fileType === 'video') {
          mediaContent += `<video controls src="${file.url}" style="max-width: 100%; height: auto;"></video>`;
        }
      });
    }

    // Check if current user is the author of this post
    const currentUserId = localStorage.getItem('userId');
    const isOwner = post.author?._id === currentUserId;
    const deleteButton = isOwner ? `<button onclick="deletePost('${post._id}')" class="delete-btn">Delete</button>` : '';

    postEl.innerHTML = `
      <div class="post-header">
        <strong>${post.author?.username || 'Unknown User'}</strong>
        <span>${new Date(post.createdAt).toLocaleString()}</span>
        ${deleteButton}
      </div>
      <div class="post-content">
        ${post.content ? `<p>${post.content}</p>` : ''}
        ${mediaContent}
      </div>
      <div class="post-meta">
        <button onclick="likePost('${post._id}')">Like (${post.likes?.length || 0})</button>
        <span>${post.comments?.length || 0} Comments</span>
      </div>
      <div class="comment-section">
        ${post.comments?.map(c => {
          // Check if current user can delete this comment (comment author or post author)
          const canDeleteComment = (c.user?._id === currentUserId) || (post.author?._id === currentUserId);
          const deleteBtn = canDeleteComment ? `<button onclick="deleteComment('${post._id}', '${c._id}')" class="delete-comment-btn">×</button>` : '';
          
          // Check if current user can like this comment (not their own comment)
          const canLikeComment = c.user?._id !== currentUserId;
          const likeCount = c.likes?.length || 0;
          const likeBtn = canLikeComment ? `<button onclick="likeComment('${post._id}', '${c._id}')" class="like-comment-btn">❤️ ${likeCount}</button>` : (likeCount > 0 ? `<span class="comment-likes">❤️ ${likeCount}</span>` : '');
          
          return `<div class="comment">
            <div class="comment-content">
              <strong>${c.user?.username || 'Unknown'}:</strong> ${c.text}
            </div>
            <div class="comment-actions">
              ${likeBtn}
              ${deleteBtn}
            </div>
          </div>`;
        }).join('') || ''}
        <form class="comment-form" onsubmit="return commentOnPost(event, '${post._id}')">
          <input type="text" name="comment" placeholder="Write a comment..." required />
          <button type="submit">Post</button>
        </form>
      </div>
    `;

    postsContainer.appendChild(postEl);
  });
}

async function openPostModal() {
  if (!checkAuth()) return;
  
  // Populate group dropdown
  await populateGroupDropdown();
  
  document.getElementById("postModal").classList.remove("hidden");
}

// Populate the group dropdown with user's groups
async function populateGroupDropdown() {
  const groupSelect = document.getElementById('groupSelect');
  
  // Reset dropdown
  groupSelect.innerHTML = '<option value="">My Feed (Public)</option>';
  
  try {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      
      if (user.groups && user.groups.length > 0) {
        user.groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group._id;
          option.textContent = group.name || 'Unnamed Group';
          groupSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error loading groups for post creation:', error);
  }
}

function closePostModal() {
  document.getElementById("postModal").classList.add("hidden");
}

document.getElementById("postForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const formData = new FormData(this);
  const text = formData.get('text');
  const media = formData.get('media');
  const selectedGroup = formData.get('group');
  
  // Prepare the post data
  const postData = {
    content: text,
    type: 'text'
  };
  
  // Add group to post data if selected
  if (selectedGroup) {
    postData.group = selectedGroup;
  }
  
  // If there's media, convert to base64 and add to post data
  if (media && media.size > 0) {
    postData.type = 'media';
    
    try {
      // Convert file to base64
      const base64 = await convertFileToBase64(media);
      postData.files = [{
        url: base64,
        fileType: media.type.startsWith('image/') ? 'image' : 'video'
      }];
    } catch (error) {
      console.error('Error converting file to base64:', error);
      return;
    }
  }

  try {
    const response = await fetch("http://localhost:5000/api/posts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(postData)
    });
    
    if (response.ok) {
      closePostModal();
      fetchFeed();
      // Reset the form
      this.reset();
    } else {
      console.error('Failed to create post');
    }
  } catch (error) {
    console.error('Error creating post:', error);
  }
});

// Helper function to convert file to base64
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function likePost(postId) {
  if (!checkAuth()) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
      method: "PATCH", // Use PATCH for toggle functionality
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Like toggled:', result.message);
      
      // Maintain current view - if we're viewing group posts, stay there
      if (window.currentSearchQuery === 'group-filter' && window.currentGroupId) {
        await viewGroupPosts(window.currentGroupId);
      } else {
        fetchFeed();
      }
    } else {
      const errorData = await response.json();
      console.error('Failed to toggle like:', errorData.message || 'Unknown error');
      alert('Failed to like post: ' + (errorData.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    alert('Error liking post. Please try again.');
  }
}

async function commentOnPost(event, postId) {
  event.preventDefault();
  if (!checkAuth()) return;
  
  const form = event.target;
  const text = form.comment.value;
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    
    if (response.ok) {
      form.reset(); // Clear the comment input
      
      // Maintain current view - if we're viewing group posts, stay there
      if (window.currentSearchQuery === 'group-filter' && window.currentGroupId) {
        await viewGroupPosts(window.currentGroupId);
      } else {
        fetchFeed();
      }
    } else {
      const errorData = await response.json();
      console.error('Failed to add comment:', errorData.message || 'Unknown error');
      alert('Failed to add comment: ' + (errorData.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    alert('Error adding comment. Please check your connection and try again.');
  }
  
  return false;
}

async function deleteComment(postId, commentId) {
  if (!checkAuth()) return;
  
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this comment?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('Comment deleted successfully');
      
      // Maintain current view - if we're viewing group posts, stay there
      if (window.currentSearchQuery === 'group-filter' && window.currentGroupId) {
        await viewGroupPosts(window.currentGroupId);
      } else {
        fetchFeed();
      }
    } else {
      const errorData = await response.json();
      console.error('Failed to delete comment:', errorData.message || 'Unknown error');
      alert('Failed to delete comment: ' + (errorData.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Error deleting comment. Please try again.');
  }
}

async function deletePost(postId) {
  if (!checkAuth()) return;
  
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('Post deleted successfully');
      // Refresh the feed to show updated posts
      fetchFeed();
    } else {
      const errorData = await response.json();
      console.error('Failed to delete post:', errorData.message || 'Unknown error');
      alert('Failed to delete post: ' + (errorData.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Error deleting post. Please try again.');
  }
}



async function fetchFriendsAndGroups() {
  if (!checkAuth()) return;

  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.log('No user ID found, skipping friends/groups fetch');
    return;
  }

  try {
    // Fetch the user object (with friends and groups as arrays of objects)
    const userRes = await fetch(`http://localhost:5000/api/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      credentials: 'include'
    });
    const user = await userRes.json();

    const friendList = document.getElementById("friendList");
    const groupList = document.getElementById("groupList");
    friendList.innerHTML = '';
    groupList.innerHTML = '';

    // Display friends
    if (user.friends && user.friends.length > 0) {
      user.friends.forEach(friend => {
        const li = document.createElement("li");
        li.textContent = friend.username || friend.email || 'Unknown';
        friendList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No friends yet";
      friendList.appendChild(li);
    }

    // Display groups
    if (user.groups && user.groups.length > 0) {
      user.groups.forEach(group => {
        const li = document.createElement("li");
        li.className = 'group-item';
        
        // Check if current user is admin of this group
        const currentUserId = localStorage.getItem('userId');
        const isAdmin = group.admin && group.admin.toString() === currentUserId;
        
        li.innerHTML = `
          <div class="group-info">
            <span class="group-name">${group.name || 'Unnamed Group'}</span>
            ${group.description ? `<small class="group-desc">${group.description}</small>` : ''}
            ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
          </div>
          <div class="group-actions">
            <button onclick="viewGroupPosts('${group._id}')" class="view-group-btn">View Posts</button>
          </div>
        `;
        
        groupList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No groups yet";
      groupList.appendChild(li);
    }
  } catch (error) {
    console.error('Error fetching friends and groups:', error);
  }
}

// View posts from a specific group
async function viewGroupPosts(groupId) {
  if (!checkAuth()) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts?groupId=${groupId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const groupPosts = await response.json();
      console.log('Group posts:', groupPosts);
      
      // Display only group posts in the feed
      if (window.displayPosts) {
        window.displayPosts(groupPosts);
      } else {
        displayPostsDirectly(groupPosts);
      }
      
      // Show a message and button to return to full feed
      showGroupFilterMessage(groupPosts.length);
      
      // Update search state to show we're filtering by group
      window.currentSearchQuery = 'group-filter';
      window.currentGroupId = groupId;
    } else {
      console.error('Failed to fetch group posts');
      alert('Failed to load group posts');
    }
  } catch (error) {
    console.error('Error fetching group posts:', error);
    alert('Error loading group posts. Please try again.');
  }
}

// Show message when filtering by group
function showGroupFilterMessage(postCount) {
  const postsContainer = document.getElementById("posts");
  
  // Create filter message element
  const filterMessage = document.createElement("div");
  filterMessage.id = "group-filter-message";
  filterMessage.className = "group-filter-message";
  filterMessage.innerHTML = `
    <div class="filter-info">
      <span>Showing ${postCount} group post${postCount !== 1 ? 's' : ''}</span>
      <button onclick="showAllPosts()" class="show-all-btn">Show Feed Posts</button>
    </div>
  `;
  
  // Remove existing filter message if present
  const existingMessage = document.getElementById("group-filter-message");
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Insert at the beginning of posts container
  postsContainer.insertBefore(filterMessage, postsContainer.firstChild);
}

// Show all posts (return to full feed)
async function showAllPosts() {
  // Remove filter message
  const filterMessage = document.getElementById("group-filter-message");
  if (filterMessage) {
    filterMessage.remove();
  }
  
  // Reset search state
  window.currentSearchQuery = '';
  window.currentGroupId = null;
  
  // Fetch and display full feed
  await fetchFeed();
}

async function likeComment(postId, commentId) {
  if (!checkAuth()) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments/${commentId}/like`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Comment like toggled:', result.message);
      
      // Maintain current view - if we're viewing group posts, stay there
      if (window.currentSearchQuery === 'group-filter' && window.currentGroupId) {
        await viewGroupPosts(window.currentGroupId);
      } else {
        fetchFeed();
      }
    } else {
      const errorData = await response.json();
      console.error('Failed to toggle comment like:', errorData.message || 'Unknown error');
      alert('Failed to like comment: ' + (errorData.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    alert('Error liking comment. Please try again.');
  }
}

// Make functions globally accessible
window.viewGroupPosts = viewGroupPosts;
window.showAllPosts = showAllPosts;
window.deleteComment = deleteComment;
window.likeComment = likeComment;
$(document).ready(function () {
  console.log('Search functionality initialized');
  
  let allPosts = []; // Store all posts for filtering
  let currentSearchQuery = ''; // Track current search
  
  // Make displayPosts function globally accessible
  window.displayPosts = function(posts) {
    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = "";

    if (posts.length === 0) {
      if (currentSearchQuery) {
        postsContainer.innerHTML = `<p>No posts found matching "${currentSearchQuery}". <button onclick="clearSearch()">Show all posts</button></p>`;
      } else {
        postsContainer.innerHTML = '<p>No posts available. Be the first to post!</p>';
      }
      return;
    }

    posts.forEach(post => {
      const postEl = document.createElement("div");
      postEl.className = "post";

      // Handle media display
      let mediaContent = '';
      if (post.files && post.files.length > 0) {
        post.files.forEach(file => {
          if (file.fileType === 'image') {
            mediaContent += `<img src="${file.url}" alt="Post image" style="max-width: 100%; height: auto;" />`;
          } else if (file.fileType === 'video') {
            mediaContent += `<video controls src="${file.url}" style="max-width: 100%; height: auto;"></video>`;
          }
        });
      }

      // Check if current user is the author of this post
      const currentUserId = localStorage.getItem('userId');
      const isOwner = post.author?._id === currentUserId;
      const deleteButton = isOwner ? `<button onclick="deletePost('${post._id}')" class="delete-btn">Delete</button>` : '';

      postEl.innerHTML = `
        <div class="post-header">
          <strong>${post.author?.username || 'Unknown User'}</strong>
          <span>${new Date(post.createdAt).toLocaleString()}</span>
          ${deleteButton}
        </div>
        <div class="post-content">
          ${post.content ? `<p>${post.content}</p>` : ''}
          ${mediaContent}
        </div>
        <div class="post-meta">
          <button onclick="likePost('${post._id}')">Like (${post.likes?.length || 0})</button>
          <span>${post.comments?.length || 0} Comments</span>
        </div>
        <div class="comment-section">
          ${post.comments?.map(c => {
            // Check if current user can delete this comment (comment author or post author)
            const canDeleteComment = (c.user?._id === currentUserId) || (post.author?._id === currentUserId);
            const deleteBtn = canDeleteComment ? `<button onclick="deleteComment('${post._id}', '${c._id}')" class="delete-comment-btn">×</button>` : '';
            
            // Check if current user can like this comment (not their own comment)
            const canLikeComment = c.user?._id !== currentUserId;
            const likeCount = c.likes?.length || 0;
            const likeBtn = canLikeComment ? `<button onclick="likeComment('${post._id}', '${c._id}')" class="like-comment-btn">❤️ ${likeCount}</button>` : (likeCount > 0 ? `<span class="comment-likes">❤️ ${likeCount}</span>` : '');
            
            return `<div class="comment">
              <div class="comment-content">
                <strong>${c.user?.username || 'Unknown'}:</strong> ${c.text}
              </div>
              <div class="comment-actions">
                ${likeBtn}
                ${deleteBtn}
              </div>
            </div>`;
          }).join('') || ''}
          <form class="comment-form" onsubmit="return commentOnPost(event, '${post._id}')">
            <input type="text" name="comment" placeholder="Write a comment..." required />
            <button type="submit">Post</button>
          </form>
        </div>
      `;

      postsContainer.appendChild(postEl);
    });
  };
  
  $('#search-button').on('click', function () {
    const query = $('#search-input').val().trim();
    console.log('Search query:', query);
    
    if (!query) {
      console.log('Empty query, showing all posts');
      currentSearchQuery = '';
      window.displayPosts(window.allPosts);
      return;
    }

    currentSearchQuery = query;
    console.log('Starting search for:', query);

    // Search for posts only (since we're filtering the feed)
    $.ajax({
      url: `http://localhost:5000/api/posts/search?q=${encodeURIComponent(query)}`,
      method: 'GET',
      xhrFields: { withCredentials: true },
      headers: { "Authorization": `Bearer ${token}` }
    }).then(data => {
      console.log('Posts search result:', data);
      const searchResults = Array.isArray(data) ? data : [];
      window.displayPosts(searchResults);
    }).catch(error => {
      console.error('Posts search error:', error);
      // If search fails, show all posts
      window.displayPosts(window.allPosts);
    });
  });

  // Clear search and show all posts
  window.clearSearch = function() {
    console.log('Clearing search manually');
    $('#search-input').val('');
    currentSearchQuery = '';
    window.displayPosts(window.allPosts);
  };

  // Add search input event listener for real-time search
  $('#search-input').on('input', function() {
    const query = $(this).val().trim();
    if (!query) {
      console.log('Search cleared, showing all posts');
      currentSearchQuery = '';
      window.displayPosts(window.allPosts);
    }
  });

  // Add keyup event to handle backspace/delete
  $('#search-input').on('keyup', function(e) {
    const query = $(this).val().trim();
    if (!query) {
      console.log('Search input empty after keyup, showing all posts');
      currentSearchQuery = '';
      window.displayPosts(window.allPosts);
    }
  });

  // Add Enter key support for search
  $('#search-input').on('keypress', function(e) {
    if (e.which === 13) { // Enter key
      $('#search-button').click();
    }
  });

  // Store allPosts globally so fetchFeed can access it
  window.allPosts = allPosts;
});


document.addEventListener("DOMContentLoaded", () => {
  console.log('Feed page loaded');
  console.log('JWT token from localStorage:', localStorage.getItem('jwt'));
  console.log('User ID from localStorage:', localStorage.getItem('userId'));
  
  // Check authentication before loading content
  if (!checkAuth()) {
    console.log('Authentication failed, redirecting to login');
    return; // Will redirect to login
  }
  
  console.log('Authentication successful, fetching feed and friends/groups');
  fetchFeed();
  fetchFriendsAndGroups();
});

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("funnyCanvas");
  if (!canvas) return; // prevent error if canvas doesn't exist on some pages

  const ctx = canvas.getContext("2d");

  let x = 20, y = 20;
  let dx = 2, dy = 2;
  const faceRadius = 20;

  function drawFace() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Face
    ctx.beginPath();
    ctx.arc(x, y, faceRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffcc00";
    ctx.fill();
    ctx.closePath();

    // Eyes
    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 3, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();

    // Mouth (smile)
    ctx.beginPath();
    ctx.arc(x, y + 5, 7, 0, Math.PI);
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Movement logic
    if (x + dx > canvas.width - faceRadius || x + dx < faceRadius) dx = -dx;
    if (y + dy > canvas.height - faceRadius || y + dy < faceRadius) dy = -dy;

    x += dx;
    y += dy;

    requestAnimationFrame(drawFace);
  }

  drawFace();
});