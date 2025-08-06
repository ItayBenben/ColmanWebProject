function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

$(document).ready(function () {
    const registerForm = $('#register-form');
    const messageElement = $('#register-message');
    
    function postFB(post) {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.log('No token available for Facebook post');
            return;
        }
        
        $.ajax({
            url: `http://localhost:5000/api/fb/`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: JSON.stringify({ "fb": post }),
            xhrFields: { withCredentials: true },
            success: function (result) {
                console.log('fb post posted:', result);
            },
            error: function (error) {
                console.error('Error posting on fb:', error);
            }
        });
    }
    
    registerForm.on('submit', function (e) {
        e.preventDefault();

        const username = $('#name').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const age = $('#age').val();
        const gender = $('#gender').val();
        const address = $('#address').val();

        $.ajax({
            url: `http://localhost:5000/api/auth/register`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ username, email, password, age, gender, address }),
            xhrFields: { withCredentials: true },
            success: function (data) {
                console.log('Registration successful');
                
                // Store JWT token if provided
                if (data.token) {
                    localStorage.setItem('jwt', data.token);
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('username', data.user.username);
                }
                
                //postFB(`A new member has joined us! Welcome ${username}!`);
                window.location.href = 'login.html';
            },
            error: function (jqXHR) {
                console.log('Registration data sent:', { username, email, password, age, gender, address });
                const errorMessage = jqXHR.responseJSON?.message || 'An unknown error occurred';
                console.error('Error:', errorMessage);
                messageElement.text('Error: ' + errorMessage).css('color', 'red');
            }
        });
    });
});