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
const profileUserId = getQueryParam('user');

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


});


async function loadUserProfile(userId) {
    try {
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
        const friendList = document.getElementById('friendList');
        friendList.innerHTML = '';
        if (user.friends && user.friends.length > 0) {
            user.friends.forEach(friend => {
                const li = document.createElement('li');
                li.textContent = friend.username || friend.email || 'Unknown';
                friendList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No friends yet';
            friendList.appendChild(li);
        }

        // Populate groups list
        const groupList = document.getElementById('groupList');
        groupList.innerHTML = '';
        if (user.groups && user.groups.length > 0) {
            user.groups.forEach(group => {
                const li = document.createElement('li');
                li.textContent = group.name || 'Unnamed Group';
                groupList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No groups yet';
            groupList.appendChild(li);
        }
    } catch (err) {
        console.error('Error loading user profile:', err);
        document.querySelector('.profile-container').innerHTML = '<p>Error loading profile</p>';
    }
}

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