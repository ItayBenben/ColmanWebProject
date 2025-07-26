function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  const currentUserId = getCookie('id');
  const profileUserId = getQueryParam('user');
  
  // Only allow editing own profile
  if (currentUserId && profileUserId && currentUserId === profileUserId) {
    const editBtn = document.getElementById('editBtn');
    editBtn.classList.remove('hidden');
    editBtn.addEventListener('click', openEditProfileModal);
  }
  
  function openEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('hidden');
  
    // Pre-fill fields from the page
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
  
  // Submit form
  document.getElementById('editProfileForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();
    formData.append('id', currentUserId); // for backend
    formData.append('name', form.name.value);
    formData.append('email', form.email.value);
    formData.append('age', form.age.value);
    formData.append('gender', form.gender.value);
    formData.append('education', form.education.value);
    formData.append('birthday', form.birthday.value);
    formData.append('location', form.location.value);
    formData.append('bio', form.bio.value);
    if (form.picture.files.length > 0) {
      formData.append('picture', form.picture.files[0]);
    }
  
    try {
      const response = await fetch('/api/user/', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const updated = await response.json();
        alert('Profile updated!');
  
        // Update visible page
        document.getElementById('user-name').textContent = updated.name;
        document.getElementById('user-email').textContent = updated.email;
        document.getElementById('user-age').textContent = updated.age;
        document.getElementById('user-gender').textContent = updated.gender;
        document.getElementById('user-education').textContent = updated.education;
        document.getElementById('user-birthday').textContent = updated.birthday;
        document.getElementById('user-location').textContent = updated.location;
        document.getElementById('user-bio').textContent = updated.bio;
  
        if (updated.pictureUrl) {
          document.getElementById('user-avatar').src = updated.pictureUrl;
        }
  
        closeEditProfileModal();
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  });

  function showMapForAddress(address) {
    const mapContainer = document.getElementById('map');
    mapContainer.classList.remove('hidden');
  
    const encodedAddress = encodeURIComponent(address);
    const iframe = document.createElement('iframe');
  
    iframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDOxQQSyRWYgdoXi3h7jJANGuN5hJRHt7s&q=${encodedAddress}`;
    iframe.width = '100%';
    iframe.height = '300';
    iframe.style.border = '0';
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
  
    mapContainer.innerHTML = '';
    mapContainer.appendChild(iframe);
  }
  
// Example JSON coming from backend
const user = {
    name: "Jane Doe",
    avatar: "jane-avatar.jpg",
    email: "jane@example.com",
    location: "Tel Aviv, Israel",
    birthday: "1995-06-15",
    joinDate: "2023-01-10",
  };
  
  // Populate user data
  document.getElementById("user-name").textContent = user.name;
  document.getElementById("user-avatar").src = user.avatar;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-location").textContent = user.location;
  document.getElementById("user-birthday").textContent = new Date(user.birthday).toLocaleDateString();
    // load map
    
    showMapForAddress(user.location);
    