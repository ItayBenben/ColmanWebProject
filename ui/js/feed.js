function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : null;
  }
const token = localStorage.getItem("authToken");

async function fetchFeed() {
  const res = await fetch("http://localhost:5000/api/feed/", {
    headers: { "x-auth-token": token }
  });
  const posts = await res.json();
  const currentUserId = getCookie('id');
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  posts.forEach(post => {
    const postEl = document.createElement("div");
    postEl.className = "post";

    postEl.innerHTML = `
      <div class="post-header">
        <strong>${post.owner.name}</strong>
        <span>${new Date(post.updatedAt).toLocaleString()}</span>
      </div>
      <div class="post-content">
        ${post.type === 'image' ? `<img src="${post.content}" />` :
          post.type === 'video' ? `<video controls src="${post.content}"></video>` :
          `<p>${post.content}</p>`}
      </div>
      <div class="post-meta">
        <button onclick="likePost('${post._id}')">Like (${post.likes.length})</button>
        <span>${post.comments.length} Comments</span>
      </div>
      <div class="comment-section">
        ${post.comments.map(c => `<div class="comment"><strong>${c.user.name}:</strong> ${c.text}</div>`).join('')}
        <form class="comment-form" onsubmit="return commentOnPost(event, '${post._id}')">
          <input type="text" name="comment" placeholder="Write a comment..." required />
          <button type="submit">Post</button>
        </form>
      </div>
    `;

    postsContainer.appendChild(postEl);
  });
}

function openPostModal() {
  document.getElementById("postModal").classList.remove("hidden");
}

function closePostModal() {
  document.getElementById("postModal").classList.add("hidden");
}

document.getElementById("postForm").addEventListener("submit", async function(e) {
  e.preventDefault();
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
        "x-auth-token": token
      },
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
  await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
    method: "POST",
    headers: { "x-auth-token": token }
  });
  fetchFeed();
}

async function commentOnPost(event, postId) {
  event.preventDefault();
  const form = event.target;
  const text = form.comment.value;
  await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": token
    },
    body: JSON.stringify({ text })
  });
  fetchFeed();
  return false;
}

async function fetchFriendsAndGroups() {
  const [friendsRes, groupsRes] = await Promise.all([
    fetch(`http://localhost:5000/api/users/${getCookie('id')}`, { 
      headers: { "x-auth-token": token } 
    }),
    fetch("http://localhost:5000/api/groups", { 
      headers: { "x-auth-token": token } 
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
}
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
  
    fetch(`http://localhost:5000/api/posts/search?q=${encodeURIComponent(query)}`, {
      headers: { "x-auth-token": token }
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
  
    // Friends
    if (data.friends && data.friends.length > 0) {
      const friendSection = createResultSection('Friends', data.friends, friend => `<div class="result-item">${friend.name}</div>`);
      container.appendChild(friendSection);
    }
  
    // Groups
    if (data.groups && data.groups.length > 0) {
      const groupSection = createResultSection('Groups', data.groups, group => `<div class="result-item">${group.name}</div>`);
      container.appendChild(groupSection);
    }
  
    // Posts
    if (data.posts && data.posts.length > 0) {
      const postSection = createResultSection('Posts', data.posts, post => `
        <div class="post">
          <p><strong>${post.author}</strong></p>
          <p>${post.text}</p>
          ${post.mediaUrl ? `<img src="${post.mediaUrl}" alt="media" style="max-width: 100%"/>` : ''}
        </div>
      `);
      container.appendChild(postSection);
    }
  
    // Nothing found
    if (
      (!data.friends || data.friends.length === 0) &&
      (!data.groups || data.groups.length === 0) &&
      (!data.posts || data.posts.length === 0)
    ) {
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
  fetchFeed();
  fetchFriendsAndGroups();
});