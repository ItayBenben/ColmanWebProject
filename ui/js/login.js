function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

$(document).ready(function () {
    const loginForm = $('#login-form');
    const messageElement = $('#login-message');
    const loginButton = $('button[type="submit"]');

    // Use button click instead of form submit
    loginButton.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Login button clicked');

        const username = $('#username').val();
        const password = $('#password').val();

        if (!username || !password) {
            messageElement.text('Please fill in all fields').css('color', 'red');
            return false;
        }

        console.log('Attempting login for:', username);

        $.ajax({
            url: `http://localhost:5000/api/auth/login`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ username, password }),
            xhrFields: { withCredentials: true },
            success: function (data) {
                console.log('Login successful');
                console.log('Logged in user:', data.user.username);
                
                // Store JWT token in localStorage for API calls
                if (data.token) {
                    localStorage.setItem('jwt', data.token);
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('username', data.user.username);
                }
                
                console.log('Redirecting to feed...');
                window.location.href = 'feed.html';
            },
            error: function (jqXHR) {
                const errorMessage = jqXHR.responseJSON?.message || 'An unknown error occurred';
                console.error('Error:', errorMessage);
                messageElement.text('Error: ' + errorMessage).css('color', 'red');
            }
        });

        return false;
    });

    // Also prevent form submission as backup
    loginForm.on('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
});
