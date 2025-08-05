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
        
        // Populate profile fields
        document.getElementById('profile-username').textContent = user.username || 'N/A';
        document.getElementById('profile-email').textContent = user.email || 'N/A';
        document.getElementById('profile-age').textContent = user.age || 'N/A';
        document.getElementById('profile-gender').textContent = user.gender || 'N/A';
        document.getElementById('profile-address').textContent = user.address || 'N/A';
        
        // Show edit button if viewing own profile
        if (userId === currentUserId) {
            document.getElementById('edit-profile-btn').style.display = 'block';
        }
        
    } catch (err) {
        console.error('Error loading user profile:', err);
        document.getElementById('profile-container').innerHTML = '<p>Error loading profile</p>';
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
        username: form.username.value,
        email: form.email.value,
        age: form.age.value,
        gender: form.gender.value,
        address: form.address.value
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
    if (address) {
        const encodedAddress = encodeURIComponent(address);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        window.open(mapUrl, '_blank');
    }
}