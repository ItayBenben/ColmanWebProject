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

// Single function to render a post (eliminates duplication)
function renderPost(post, container = null) {
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

  // Render comments
  const commentsHtml = post.comments?.map(c => {
    const canDeleteComment = (c.user?._id === currentUserId) || (post.author?._id === currentUserId);
    const deleteBtn = canDeleteComment ? `<button onclick="deleteComment('${post._id}', '${c._id}')" class="delete-comment-btn">×</button>` : '';
    
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
  }).join('') || '';

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
      ${commentsHtml}
      <form class="comment-form" onsubmit="return commentOnPost(event, '${post._id}')">
        <input type="text" name="comment" placeholder="Write a comment..." required />
        <button type="submit">Post</button>
      </form>
    </div>
  `;

  if (container) {
    container.appendChild(postEl);
  }
  return postEl;
}

// Single function to display posts (eliminates duplication)
function displayPosts(posts, container = null) {
  const postsContainer = container || document.getElementById("posts");
  postsContainer.innerHTML = "";

  if (posts.length === 0) {
    postsContainer.innerHTML = '<p>No posts available. Be the first to post!</p>';
    return;
  }

  posts.forEach(post => renderPost(post, postsContainer));
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
    window.allPosts = posts;
    displayPosts(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
  }
}

async function openPostModal() {
  if (!checkAuth()) return;
  await populateGroupDropdown();
  document.getElementById("postModal").classList.remove("hidden");
}

async function populateGroupDropdown() {
  const groupSelect = document.getElementById('groupSelect');
  groupSelect.innerHTML = '<option value="">My Feed (Public)</option>';
  
  try {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` },
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
  
  const postData = {
    content: text,
    type: 'text'
  };
  
  if (selectedGroup) {
    postData.group = selectedGroup;
  }
  
  if (media && media.size > 0) {
    postData.type = 'media';
    try {
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
      this.reset();
    } else {
      console.error('Failed to create post');
    }
  } catch (error) {
    console.error('Error creating post:', error);
  }
});

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
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Like toggled:', result.message);
      
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
      form.reset();
      
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
    const userRes = await fetch(`http://localhost:5000/api/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      credentials: 'include'
    });
    const user = await userRes.json();

    const friendList = document.getElementById("friendList");
    const groupList = document.getElementById("groupList");
    friendList.innerHTML = '';
    groupList.innerHTML = '';

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

    if (user.groups && user.groups.length > 0) {
      user.groups.forEach(group => {
        const li = document.createElement("li");
        li.className = 'group-item';
        
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
      
      displayPosts(groupPosts);
      showGroupFilterMessage(groupPosts.length);
      
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

function showGroupFilterMessage(postCount) {
  const postsContainer = document.getElementById("posts");
  
  const filterMessage = document.createElement("div");
  filterMessage.id = "group-filter-message";
  filterMessage.className = "group-filter-message";
  filterMessage.innerHTML = `
    <div class="filter-info">
      <span>Showing ${postCount} group post${postCount !== 1 ? 's' : ''}</span>
      <button onclick="showAllPosts()" class="show-all-btn">Show Feed Posts</button>
    </div>
  `;
  
  const existingMessage = document.getElementById("group-filter-message");
  if (existingMessage) {
    existingMessage.remove();
  }
  
  postsContainer.insertBefore(filterMessage, postsContainer.firstChild);
}

async function showAllPosts() {
  const filterMessage = document.getElementById("group-filter-message");
  if (filterMessage) {
    filterMessage.remove();
  }
  
  window.currentSearchQuery = '';
  window.currentGroupId = null;
  
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

// Search functionality
$(document).ready(function () {
  console.log('Search functionality initialized');
  
  let allPosts = [];
  let currentSearchQuery = '';
  
  window.displayPosts = displayPosts;
  
  $('#search-button').on('click', function () {
    const query = $('#search-input').val().trim();
    console.log('Search query:', query);
    
    if (!query) {
      console.log('Empty query, showing all posts');
      currentSearchQuery = '';
      displayPosts(allPosts);
      return;
    }

    currentSearchQuery = query;
    console.log('Starting search for:', query);

    const searchPosts = $('#search-posts').is(':checked');
    const searchUsers = $('#search-users').is(':checked');

    if (!searchPosts && !searchUsers) {
      console.log('No search type selected');
      return;
    }

    const searchPromises = [];

    if (searchPosts) {
      searchPromises.push(
        $.ajax({
          url: `http://localhost:5000/api/posts/search?q=${encodeURIComponent(query)}`,
          method: 'GET',
          xhrFields: { withCredentials: true },
          headers: { "Authorization": `Bearer ${token}` }
        })
      );
    }

    if (searchUsers) {
      searchPromises.push(
        $.ajax({
          url: `http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`,
          method: 'GET',
          xhrFields: { withCredentials: true },
          headers: { "Authorization": `Bearer ${token}` }
        })
      );
    }

    Promise.all(searchPromises)
      .then(async results => {
        console.log('Search results:', results);
        
        let posts = [];
        let users = [];
        
        if (searchPosts && results[0]) {
          posts = Array.isArray(results[0]) ? results[0] : [];
        }
        
        if (searchUsers && results[searchPosts ? 1 : 0]) {
          users = Array.isArray(results[searchPosts ? 1 : 0]) ? results[searchPosts ? 1 : 0] : [];
          
          const userPostsPromises = users.map(async user => {
            try {
              const response = await fetch(`http://localhost:5000/api/posts?userId=${user._id}`, {
                headers: { "Authorization": `Bearer ${token}` },
                credentials: 'include'
              });
              
              if (response.ok) {
                const userPosts = await response.json();
                return { user, posts: userPosts, authorized: true };
              } else if (response.status === 403) {
                // User not authorized to see posts, but can still see user info
                return { user, posts: [], authorized: false };
              } else {
                return { user, posts: [], authorized: false };
              }
            } catch (error) {
              console.error(`Error fetching posts for user ${user._id}:`, error);
              return { user, posts: [], authorized: false };
            }
          });
          
          const userPostsResults = await Promise.all(userPostsPromises);
          displaySearchResultsWithUserPosts(posts, userPostsResults, query);
          return;
        }

        displaySearchResults(posts, users, query);
      })
      .catch(error => {
        console.error('Search error:', error);
        displayPosts(allPosts);
      });
  });

  window.clearSearch = function() {
    console.log('Clearing search manually');
    $('#search-input').val('');
    currentSearchQuery = '';
    displayPosts(allPosts);
  };

  $('#search-input').on('input', function() {
    const query = $(this).val().trim();
    if (!query) {
      console.log('Search cleared, showing all posts');
      currentSearchQuery = '';
      displayPosts(allPosts);
    }
  });

  $('#search-input').on('keyup', function(e) {
    const query = $(this).val().trim();
    if (!query) {
      console.log('Search input empty after keyup, showing all posts');
      currentSearchQuery = '';
      displayPosts(allPosts);
    }
  });

  $('#search-input').on('keypress', function(e) {
    if (e.which === 13) {
      $('#search-button').click();
    }
  });

  window.allPosts = allPosts;
});

function displaySearchResults(posts, users, query) {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  let hasResults = false;

  if (posts.length > 0) {
    hasResults = true;
    const postsSection = document.createElement("div");
    postsSection.className = "search-section";
    postsSection.innerHTML = `<h3>📝 Posts (${posts.length})</h3>`;
    postsContainer.appendChild(postsSection);

    const postsContainerInner = document.createElement("div");
    postsContainer.appendChild(postsContainerInner);
    
    posts.forEach(post => renderPost(post, postsContainerInner));
  }

  if (users.length > 0) {
    hasResults = true;
    const usersSection = document.createElement("div");
    usersSection.className = "search-section";
    usersSection.innerHTML = `<h3>👥 Users (${users.length})</h3>`;
    postsContainer.appendChild(usersSection);

    const usersList = document.createElement("div");
    usersList.className = "users-list";
    
    users.forEach(user => {
      const userItem = document.createElement("div");
      userItem.className = "user-item";
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <div class="user-name">${user.username}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
        <div class="user-actions">
          <button onclick="viewUserProfile('${user._id}')" class="view-profile-btn">View Profile</button>
        </div>
      `;
      usersList.appendChild(userItem);
    });
    
    postsContainer.appendChild(usersList);
  }

  if (!hasResults) {
    postsContainer.innerHTML = `
      <div class="no-results">
        <p>No results found for "${query}"</p>
        <button onclick="clearSearch()" class="show-all-btn">Show all posts</button>
      </div>
    `;
  }
}

function viewUserProfile(userId) {
  window.location.href = `user_profile.html?id=${userId}`;
}

function displaySearchResultsWithUserPosts(posts, userPostsResults, query) {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  let hasResults = false;

  if (posts.length > 0) {
    hasResults = true;
    const postsSection = document.createElement("div");
    postsSection.className = "search-section";
    postsSection.innerHTML = `<h3>📝 Posts (${posts.length})</h3>`;
    postsContainer.appendChild(postsSection);

    const postsContainerInner = document.createElement("div");
    postsContainer.appendChild(postsContainerInner);
    
    posts.forEach(post => renderPost(post, postsContainerInner));
  }

  if (userPostsResults.length > 0) {
    hasResults = true;
    
    userPostsResults.forEach(userData => {
      const { user, posts: userPosts, authorized } = userData;
      
      const userSection = document.createElement("div");
      userSection.className = "user-posts-section";
      
      const userHeader = document.createElement("div");
      userHeader.className = "user-header";
      userHeader.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <div class="user-name">${user.username}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
        <div class="user-actions">
          <button onclick="viewUserProfile('${user._id}')" class="view-profile-btn">View Profile</button>
        </div>
      `;
      userSection.appendChild(userHeader);
      
      if (userPosts.length > 0) {
        const postsHeader = document.createElement("div");
        postsHeader.className = "user-posts-header";
        postsHeader.innerHTML = `<h4>📝 Posts by ${user.username} (${userPosts.length})</h4>`;
        userSection.appendChild(postsHeader);
        
        const postsContainerInner = document.createElement("div");
        userSection.appendChild(postsContainerInner);
        
        userPosts.forEach(post => renderPost(post, postsContainerInner));
      } else if (!authorized) {
        const noPostsMsg = document.createElement("div");
        noPostsMsg.className = "no-posts-msg";
        noPostsMsg.innerHTML = `<p>🔒 Posts from ${user.username} are not available (not friends or not in same groups)</p>`;
        userSection.appendChild(noPostsMsg);
      } else {
        const noPostsMsg = document.createElement("div");
        noPostsMsg.className = "no-posts-msg";
        noPostsMsg.innerHTML = `<p>No posts available from ${user.username}</p>`;
        userSection.appendChild(noPostsMsg);
      }
      
      postsContainer.appendChild(userSection);
    });
  }

  if (!hasResults) {
    postsContainer.innerHTML = `
      <div class="no-results">
        <p>No results found for "${query}"</p>
        <button onclick="clearSearch()" class="show-all-btn">Show all posts</button>
      </div>
    `;
  }
}

// Make functions globally accessible
window.displaySearchResults = displaySearchResults;
window.displaySearchResultsWithUserPosts = displaySearchResultsWithUserPosts;
window.viewUserProfile = viewUserProfile;
window.viewGroupPosts = viewGroupPosts;
window.showAllPosts = showAllPosts;
window.deleteComment = deleteComment;
window.likeComment = likeComment;

document.addEventListener("DOMContentLoaded", () => {
  console.log('Feed page loaded');
  console.log('JWT token from localStorage:', localStorage.getItem('jwt'));
  console.log('User ID from localStorage:', localStorage.getItem('userId'));
  
  if (!checkAuth()) {
    console.log('Authentication failed, redirecting to login');
    return;
  }
  
  console.log('Authentication successful, fetching feed and friends/groups');
  fetchFeed();
  fetchFriendsAndGroups();
});

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("funnyCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let x = 20, y = 20;
  let dx = 2, dy = 2;
  const faceRadius = 20;

  function drawFace() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(x, y, faceRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffcc00";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 3, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y + 5, 7, 0, Math.PI);
    ctx.strokeStyle = "#000";
    ctx.stroke();

    if (x + dx > canvas.width - faceRadius || x + dx < faceRadius) dx = -dx;
    if (y + dy > canvas.height - faceRadius || y + dy < faceRadius) dy = -dy;

    x += dx;
    y += dy;

    requestAnimationFrame(drawFace);
  }

  drawFace();
});