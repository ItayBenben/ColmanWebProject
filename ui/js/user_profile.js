function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : null;
  }
  
  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  const currentUserId = getCookie('id');
  const profileUserId = getQueryParam('user');
  
  // Main
  window.addEventListener('DOMContentLoaded', () => {
    if (profileUserId) {
      loadUserProfile(profileUserId);
    }
  
    // Show edit button if viewing own profile
    if (currentUserId === profileUserId) {
      const editBtn = document.getElementById('editBtn');
      editBtn.classList.remove('hidden');
      editBtn.addEventListener('click', openEditProfileModal);
    } else {
      const addFriendBtn = document.getElementById('addFriendBtn');
      addFriendBtn.classList.remove('hidden');
      // Add friend functionality can go here
    }
  
    // Form submit handler
    document.getElementById('editProfileForm')?.addEventListener('submit', submitProfileEdit);
  });
  
  async function loadUserProfile(userId) {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to load user profile');
      const user = await res.json();
  
      updateUserInfo(user);
      showMapForAddress(user.location);
    } catch (err) {
      console.error(err);
      alert('Could not load profile.');
    }
  }
  
  function updateUserInfo(user) {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-age').textContent = user.age;
    document.getElementById('user-gender').textContent = user.gender;
    document.getElementById('user-education').textContent = user.education;
    document.getElementById('user-birthday').textContent = new Date(user.birthday).toLocaleDateString();
    document.getElementById('user-location').textContent = user.location;
    document.getElementById('user-bio').textContent = user.bio;
    document.getElementById('user-avatar').src = user.avatarUrl || 'default-avatar.jpg';
  }
  
  function openEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('hidden');
  
    document.getElementById('editName').value = document.getElementById('user-name').textContent;
    document.getElementById('editEmail').value = document.getElementById('user-email').textContent;
    document.getElementById('editAge').value = document.getElementById('user-age').textContent;
    document.getElementById('editGender').value = document.getElementById('user-gender').textContent;
    document.getElementById('editEducation').value = document.getElementById('user-education').textContent;
    document.getElementById('editBirthday').value = document.getElementById('user-birthday').textContent;
    document.getElementById('editLocation').value = document.getElementById('user-location').textContent;
    document.getElementById('editBio').value = document.getElementById('user-bio').textContent;
  }
  
  function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.add('hidden');
  }
  
  async function submitProfileEdit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    formData.append('id', currentUserId);
  
    try {
      const res = await fetch(`http://localhost:5000/api/users/${currentUserId}`, {
        method: 'POST',
        body: formData
      });
  
      if (!res.ok) throw new Error('Update failed');
  
      const updated = await res.json();
      updateUserInfo(updated);
      alert('Profile updated!');
      closeEditProfileModal();
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
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