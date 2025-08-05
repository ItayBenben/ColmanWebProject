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
    const currentUserId = localStorage.getItem('userId');
    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = "";

    if (posts.length === 0) {
      postsContainer.innerHTML = '<p>No posts available. Be the first to post!</p>';
      return;
    }

    posts.forEach(post => {
      const postEl = document.createElement("div");
      postEl.className = "post";

      postEl.innerHTML = `
        <div class="post-header">
          <strong>${post.author?.username || 'Unknown User'}</strong>
          <span>${new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <div class="post-content">
          ${post.type === 'image' ? `<img src="${post.imageUrl}" />` :
            post.type === 'video' ? `<video controls src="${post.videoUrl}"></video>` :
            `<p>${post.content}</p>`}
        </div>
        <div class="post-meta">
          <button onclick="likePost('${post._id}')">Like (${post.likes?.length || 0})</button>
          <span>${post.comments?.length || 0} Comments</span>
        </div>
        <div class="comment-section">
          ${post.comments?.map(c => `<div class="comment"><strong>${c.user?.username || 'Unknown'}:</strong> ${c.text}</div>`).join('') || ''}
          <form class="comment-form" onsubmit="return commentOnPost(event, '${post._id}')">
            <input type="text" name="comment" placeholder="Write a comment..." required />
            <button type="submit">Post</button>
          </form>
        </div>
      `;

      postsContainer.appendChild(postEl);
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
  }
}

function openPostModal() {
  if (!checkAuth()) return;
  document.getElementById("postModal").classList.remove("hidden");
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
  
  // Prepare the post data according to backend expectations
  const postData = {
    content: text,
    type: 'text'
  };
  
  // If there's media, we'll need to handle file upload separately
  // For now, let's just send the text content
  if (media && media.size > 0) {
    // TODO: Implement file upload handling
    console.log('File upload not implemented yet');
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
    } else {
      console.error('Failed to create post');
    }
  } catch (error) {
    console.error('Error creating post:', error);
  }
});

async function likePost(postId) {
  if (!checkAuth()) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      credentials: 'include'
    });
    
    if (response.ok) {
      fetchFeed();
    } else {
      console.error('Failed to like post');
    }
  } catch (error) {
    console.error('Error liking post:', error);
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
      fetchFeed();
    } else {
      console.error('Failed to add comment');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
  
  return false;
}

async function fetchFriendsAndGroups() {
  if (!checkAuth()) return;
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.log('No user ID found, skipping friends/groups fetch');
    return;
  }
  
  try {
    const [friendsRes, groupsRes] = await Promise.all([
      fetch(`http://localhost:5000/api/users/${userId}`, { 
        headers: { "Authorization": `Bearer ${token}` },
        credentials: 'include'
      }),
      fetch("http://localhost:5000/api/groups", { 
        headers: { "Authorization": `Bearer ${token}` },
        credentials: 'include'
      })
    ]);

    const user = await friendsRes.json();
    const groups = await groupsRes.json();

    const friendList = document.getElementById("friendList");
    const groupList = document.getElementById("groupList");

    // Clear existing lists
    friendList.innerHTML = '';
    groupList.innerHTML = '';

    // Display friends (if the user has friends populated)
    if (user.friends && user.friends.length > 0) {
      user.friends.forEach(friend => {
        const li = document.createElement("li");
        li.textContent = friend.username || friend.name;
        friendList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No friends yet";
      friendList.appendChild(li);
    }

    // Display groups
    if (groups && groups.length > 0) {
      groups.forEach(group => {
        const li = document.createElement("li");
        li.textContent = group.name;
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

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
  
    fetch(`http://localhost:5000/api/posts/search?q=${encodeURIComponent(query)}`, {
      headers: { "Authorization": `Bearer ${token}` },
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        displaySearchResults(data);
      })
      .catch(error => {
        console.error('Search error:', error);
      });
  }
  
  function displaySearchResults(data) {
    const container = document.getElementById('searchResults');
    container.innerHTML = ''; // clear previous
  
    // Posts
    if (data && data.length > 0) {
      const postSection = createResultSection('Posts', data, post => `
        <div class="post">
          <p><strong>${post.author?.username || 'Unknown'}</strong></p>
          <p>${post.content}</p>
          ${post.imageUrl ? `<img src="${post.imageUrl}" alt="media" style="max-width: 100%"/>` : ''}
          ${post.videoUrl ? `<video controls src="${post.videoUrl}" style="max-width: 100%"></video>` : ''}
        </div>
      `);
      container.appendChild(postSection);
    } else {
      container.innerHTML = '<p>No results found.</p>';
    }
  }
  
  function createResultSection(title, items, renderFn) {
    const section = document.createElement('div');
    section.className = 'results-section';
    section.innerHTML = `<h4>${title}</h4>`;
    items.forEach(item => {
      section.innerHTML += renderFn(item);
    });
    return section;
  }

document.getElementById('searchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      performSearch();
    }
});

document.addEventListener("DOMContentLoaded", () => {
  // Check authentication before loading content
  if (!checkAuth()) {
    return; // Will redirect to login
  }
  
  fetchFeed();
  fetchFriendsAndGroups();
});