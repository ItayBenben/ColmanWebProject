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
$(document).ready(function () {
  $('#search-button').on('click', function () {
    const query = $('#search-input').val().trim();
    if (!query) return;

    $.ajax({
      url: `http://localhost:5000/api/search`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ query }),
      xhrFields: { withCredentials: true },
      success: function (data) {
        showSearchResults(data);
      },
      error: function () {
        alert('Search failed. Please try again.');
      }
    });
  });

  function showSearchResults(data) {
    const resultsDiv = $('#search-results');
    resultsDiv.empty();

    const { users = [], groups = [] } = data;

    users.forEach(user => {
      const userDiv = $(`
        <div>
          <span class="search-name" data-id="${user._id}" data-type="user">${user.username}</span>
          ${user.isFriend ? '' : `<button class="friend-btn" data-id="${user._id}">Add Friend</button>`}
        </div>
      `);
      resultsDiv.append(userDiv);
    });

    groups.forEach(group => {
    const groupDiv = $(`
      <div>
        <span class="search-name" data-id="${group._id}" data-type="group">${group.name}</span>
        ${group.isMember ? '' : `<button class="group-btn" data-id="${group._id}">Join Group</button>`}
      </div>
    `);
    resultsDiv.append(groupDiv);
  });

  resultsDiv.removeClass('hidden');
}
  // Click on user or group name
  $(document).on('click', '.search-name', function () {
    const id = $(this).data('id');
    const type = $(this).data('type');
    if (type === 'user') {
      window.location.href = `profile.html?userId=${id}`;
    } else {
      window.location.href = `group.html?groupId=${id}`;
    }
  });

  // Add Friend
  $(document).on('click', '.friend-btn', function () {
    const userId = $(this).data('id');

    $.ajax({
      url: `http://localhost:5000/api/friends/request`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ userId }),
      xhrFields: { withCredentials: true },
      success: function () {
        alert('Friend request sent!');
      },
      error: function () {
        alert('Failed to send request.');
      }
    });
  });

  // Optional: Hide popup when clicking outside
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#search-container, #search-popup').length) {
      $('#search-popup').addClass('hidden');
    }
  });
});



document.addEventListener("DOMContentLoaded", () => {
  fetchFeed();
  fetchFriendsAndGroups();
});