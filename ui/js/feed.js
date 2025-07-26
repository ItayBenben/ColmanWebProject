const token = localStorage.getItem("authToken");

async function fetchFeed() {
  const res = await fetch("/api/posts/feed", {
    headers: { "x-auth-token": token }
  });
  const posts = await res.json();

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

  await fetch("/api/posts", {
    method: "POST",
    headers: {
      "x-auth-token": token
    },
    body: formData
  });

  closePostModal();
  fetchFeed();
});

async function likePost(postId) {
  await fetch(`/api/posts/${postId}/like`, {
    method: "POST",
    headers: { "x-auth-token": token }
  });
  fetchFeed();
}

async function commentOnPost(event, postId) {
  event.preventDefault();
  const form = event.target;
  const text = form.comment.value;
  await fetch(`/api/posts/${postId}/comment`, {
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
    fetch("/api/users/friends", { headers: { "x-auth-token": token } }),
    fetch("/api/user_groups/my-groups", { headers: { "x-auth-token": token } })
  ]);

  const friends = await friendsRes.json();
  const groups = await groupsRes.json();

  const friendList = document.getElementById("friendList");
  const groupList = document.getElementById("groupList");

  friends.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f.name;
    friendList.appendChild(li);
  });

  groups.forEach(g => {
    const li = document.createElement("li");
    li.textContent = g.name;
    groupList.appendChild(li);
  });
}
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
  
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        // Assume the backend returns an object like:
        // { friends: [...], groups: [...], posts: [...] }
  
        updateFriendList(data.friends);
        updateGroupList(data.groups);
        updatePosts(data.posts);
      })
      .catch(error => {
        console.error('Search error:', error);
      });
  }
  
  function updateFriendList(friends) {
    const list = document.getElementById('friendList');
    list.innerHTML = '';
    friends.forEach(friend => {
      const li = document.createElement('li');
      li.textContent = friend.name;
      list.appendChild(li);
    });
  }
  
  function updateGroupList(groups) {
    const list = document.getElementById('groupList');
    list.innerHTML = '';
    groups.forEach(group => {
      const li = document.createElement('li');
      li.textContent = group.name;
      list.appendChild(li);
    });
  }
  
  function updatePosts(posts) {
    const container = document.getElementById('posts');
    container.innerHTML = '';
    posts.forEach(post => {
      const div = document.createElement('div');
      div.className = 'post';
      div.innerHTML = `
        <p><strong>${post.author}</strong></p>
        <p>${post.text}</p>
        ${post.mediaUrl ? `<img src="${post.mediaUrl}" alt="media" />` : ''}
      `;
      container.appendChild(div);
    });
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