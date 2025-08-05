function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

$(document).ready(function () {
    const loginForm = $('#login-form');
    const messageElement = $('#login-message');

    loginForm.on('submit', function (e) {
        e.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: `http://localhost:5000/api/auth/login`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ username, password,}),
            xhrFields: { withCredentials: true }, // for cookies to be sent with cross-origin requests
            success: function (data) {
                console.log('Login successful');
                const user_id = getCookie('id');
                console.log('Logged in user:', getCookie('username'));
                window.location.href = 'feed.html';
            },
            error: function (jqXHR) {
                const errorMessage = jqXHR.responseJSON?.msg || 'An unknown error occurred';
                console.error('Error:', errorMessage);
                messageElement.text('Error: ' + errorMessage).css('color', 'red');
            }
        });
    });
});
