function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

const token = localStorage.getItem('jwt');
const currentUserId = localStorage.getItem('userId');
const profileUserId = getQueryParam('id') || getQueryParam('user');

// Check if user is authenticated
function checkAuth() {
  if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    const userId = profileUserId || currentUserId;
    if (userId) {
        await loadUserProfile(userId);

    } else {
        console.log('No user ID available');
    }

    // Add event listener for edit button
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', async function() {
            // Fetch user data to prefill the modal
            const res = await fetch(`http://localhost:5000/api/users/${currentUserId}`, {
                headers: { "Authorization": `Bearer ${token}` },
                credentials: 'include'
            });
            if (res.ok) {
                const user = await res.json();
                document.getElementById('editName').value = user.username || '';
                document.getElementById('editEmail').value = user.email || '';
                document.getElementById('editAge').value = user.age || '';
                document.getElementById('editGender').value = user.gender || '';
                document.getElementById('editLocation').value = user.address || '';
            }
            openEditProfileModal();
        });
    }

    // Add event listener for modal form submit
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', submitProfileEdit);
    }

    // Add search functionality
    $('#search-button').on('click', function () {
        const query = $('#search-input').val().trim();
        if (!query) return;

        // Show the search popup
        $('#search-popup').removeClass('hidden');
        $('#search-results').html('<p>Searching...</p>');

        // Search for users, posts, and groups
        Promise.all([
            // Search users
            $.ajax({
                url: `http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`,
                method: 'GET',
                xhrFields: { withCredentials: true },
                headers: { "Authorization": `Bearer ${token}` }
            }).catch(() => ({ users: [] })),
            
            // Search posts
            $.ajax({
                url: `http://localhost:5000/api/posts/search?q=${encodeURIComponent(query)}`,
                method: 'GET',
                xhrFields: { withCredentials: true },
                headers: { "Authorization": `Bearer ${token}` }
            }).catch(() => ({ posts: [] })),
            
            // Search groups
            $.ajax({
                url: `http://localhost:5000/api/groups/search?q=${encodeURIComponent(query)}`,
                method: 'GET',
                xhrFields: { withCredentials: true },
                headers: { "Authorization": `Bearer ${token}` }
            }).catch(() => ({ groups: [] }))
        ]).then(([userResults, postResults, groupResults]) => {
            showSearchResults({
                users: Array.isArray(userResults) ? userResults : [],
                posts: Array.isArray(postResults) ? postResults : [],
                groups: Array.isArray(groupResults) ? groupResults : []
            });
        }).catch(() => {
            $('#search-results').html('<p>Search failed. Please try again.</p>');
        });
    });

    function showSearchResults(data) {
        const resultsDiv = $('#search-results');
        resultsDiv.empty();

        const { users = [], posts = [], groups = [] } = data;
        let hasResults = false;

        // Display users
        if (users.length > 0) {
            hasResults = true;
            resultsDiv.append('<h4>Users:</h4>');
            users.forEach(user => {
                const userDiv = $(`
                    <div class="search-result-item">
                        <span class="search-name" data-id="${user._id}" data-type="user">${user.username}</span>
                        <small>${user.email || ''}</small>
                    </div>
                `);
                resultsDiv.append(userDiv);
            });
        }

        // Display posts
        if (posts.length > 0) {
            hasResults = true;
            resultsDiv.append('<h4>Posts:</h4>');
            posts.forEach(post => {
                const postDiv = $(`
                    <div class="search-result-item">
                        <span class="search-name" data-id="${post._id}" data-type="post">${post.content ? post.content.substring(0, 50) + '...' : 'No content'}</span>
                        <small>by ${post.author?.username || 'Unknown'}</small>
                    </div>
                `);
                resultsDiv.append(postDiv);
            });
        }

        // Display groups
        if (groups.length > 0) {
            hasResults = true;
            resultsDiv.append('<h4>Groups:</h4>');
            groups.forEach(group => {
                const groupDiv = $(`
                    <div class="search-result-item">
                        <span class="search-name" data-id="${group._id}" data-type="group">${group.name}</span>
                        <small>${group.description || ''}</small>
                    </div>
                `);
                resultsDiv.append(groupDiv);
            });
        }

        if (!hasResults) {
            resultsDiv.html('<p>No results found.</p>');
        }
    }

    // Click on user, post, or group name
    $(document).on('click', '.search-name', function () {
        const id = $(this).data('id');
        const type = $(this).data('type');
        
        if (type === 'user') {
            window.location.href = `user_profile.html?id=${id}`;
        } else if (type === 'post') {
            // For posts, we could scroll to the post in the feed or show it in a modal
            // For now, just close the search popup
            $('#search-popup').addClass('hidden');
        } else if (type === 'group') {
            window.location.href = `group.html?groupId=${id}`;
        }
    });

    // Close search popup when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#search-container, #search-popup').length) {
            $('#search-popup').addClass('hidden');
        }
    });

    // Close search popup when pressing Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('#search-popup').addClass('hidden');
        }
    });


});


async function loadUserProfile(userId) {
    try {
        console.log('Loading user profile for ID:', userId);
        console.log('Current user ID:', currentUserId);
        console.log('Token:', token ? 'Present' : 'Missing');
        
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
        
        const user = await res.json();
        console.log('Loaded user data:', user);
        
        // Populate profile fields (use correct HTML IDs)
        document.getElementById('user-name').textContent = user.username || 'N/A';
        document.getElementById('user-email').textContent = user.email || 'N/A';
        document.getElementById('user-age').textContent = user.age || 'N/A';
        document.getElementById('user-gender').textContent = user.gender || 'N/A';
        document.getElementById('user-location').textContent = user.address || 'N/A';
        showMapForAddress(user.address);
        // Show edit button if viewing own profile (use correct ID)
        if (userId === currentUserId) {
            document.getElementById('editBtn').style.display = 'block';
        }

        // Populate friends list
        console.log('User friends:', user.friends);
        const friendList = document.getElementById('friendList');
        friendList.innerHTML = '';
        if (user.friends && user.friends.length > 0) {
            console.log('Displaying', user.friends.length, 'friends');
            user.friends.forEach(friend => {
                const li = document.createElement('li');
                li.textContent = friend.username || friend.email || 'Unknown';
                friendList.appendChild(li);
            });
        } else {
            console.log('No friends to display');
            const li = document.createElement('li');
            li.textContent = 'No friends yet';
            friendList.appendChild(li);
        }

        // Populate groups list
        console.log('User groups:', user.groups);
        const groupList = document.getElementById('groupList');
        groupList.innerHTML = '';
        if (user.groups && user.groups.length > 0) {
            console.log('Displaying', user.groups.length, 'groups');
            user.groups.forEach(group => {
                const li = document.createElement('li');
                li.className = 'group-item';
                
                // Check if current user is admin of this group
                const isAdmin = group.admin && group.admin.toString() === currentUserId;
                
                li.innerHTML = `
                    <div class="group-info">
                        <span class="group-name">${group.name || 'Unnamed Group'}</span>
                        ${group.description ? `<small class="group-desc">${group.description}</small>` : ''}
                        ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                    </div>
                    <div class="group-actions">
                        ${isAdmin ? 
                            `<button onclick="deleteGroup('${group._id}')" class="delete-group-btn">Delete Group</button>` :
                            `<button onclick="leaveGroup('${group._id}')" class="leave-group-btn">Leave Group</button>`
                        }
                    </div>
                `;
                
                groupList.appendChild(li);
            });
        } else {
            console.log('No groups to display');
            const li = document.createElement('li');
            li.textContent = 'No groups yet';
            groupList.appendChild(li);
        }
    } catch (err) {
        console.error('Error loading user profile:', err);
        document.querySelector('.profile-container').innerHTML = '<p>Error loading profile</p>';
    }
}

// Delete group (admin only)
async function deleteGroup(groupId) {
    if (!checkAuth()) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone and will remove all group posts and members.')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/groups/${groupId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('Group deleted successfully');
            alert('Group deleted successfully');
            // Reload the profile to show updated groups
            const userId = profileUserId || currentUserId;
            await loadUserProfile(userId);
        } else {
            const errorData = await response.json();
            console.error('Failed to delete group:', errorData.message || 'Unknown error');
            alert('Failed to delete group: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Error deleting group. Please try again.');
    }
}

// Leave group (non-admin members)
async function leaveGroup(groupId) {
    if (!checkAuth()) return;
    
    // Confirm leaving
    if (!confirm('Are you sure you want to leave this group?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/groups/${groupId}/leave`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('Left group successfully');
            alert('You have left the group');
            // Reload the profile to show updated groups
            const userId = profileUserId || currentUserId;
            await loadUserProfile(userId);
        } else {
            const errorData = await response.json();
            console.error('Failed to leave group:', errorData.message || 'Unknown error');
            alert('Failed to leave group: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('Error leaving group. Please try again.');
    }
}

// Make functions globally accessible
window.deleteGroup = deleteGroup;
window.leaveGroup = leaveGroup;

async function updateUserInfo(userId, updateData) {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        return await res.json();
    } catch (err) {
        console.error('Error updating user:', err);
        throw err;
    }
}

function openEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'block';
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

async function submitProfileEdit(e) {
    e.preventDefault();
    if (!checkAuth()) return;
    
    const form = e.target;
    const updateData = {
        username: form.editName.value,
        email: form.editEmail.value,
        age: form.editAge.value,
        gender: form.editGender.value,
        address: form.editLocation.value
    };

    try {
        const res = await fetch(`http://localhost:5000/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });
        
        if (res.ok) {
            closeEditProfileModal();
            await loadUserProfile(currentUserId);
            
        } else {
            console.error('Failed to update profile');
        }
    } catch (err) {
        console.error('Error updating profile:', err);
    }
}

function showMapForAddress(address) {
    const mapContainer = document.getElementById('map');
    mapContainer.classList.remove('hidden');
  
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDOxQQSyRWYgdoXi3h7jJANGuN5hJRHt7s&q=${encodeURIComponent(address)}`;
    iframe.width = '100%';
    iframe.height = '300';
    iframe.style.border = '0';
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
  
    mapContainer.innerHTML = '';
    mapContainer.appendChild(iframe);
  }