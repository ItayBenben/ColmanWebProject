function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

$(document).ready(function () {
    const registerForm = $('#register-form');
    const messageElement = $('#register-message');
    const token = getCookie('jwt');
    function postFB(post) {
        $.ajax({
            url: `http://localhost:5000/api/auth/register`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            data: JSON.stringify({ "fb": post }),
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

        const name = $('#full name').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const age = $('#age').val();
        const gender = $('#age').val();
        const address = $('#home address').val();


        $.ajax({
            url: `http://localhost:5000/api/auth/register`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ name, email, password, age, gender, address }),
            xhrFields: { withCredentials: true },
            success: function (data) {
                console.log('Registration successful');
                postFB(`A new member has joined us! Welcome ${name}!`);
                window.location.href = 'login.html';
            },
            error: function (jqXHR) {
                const errorMessage = jqXHR.responseJSON?.msg || jqXHR.responseJSON?.errors?.[0]?.msg || 'An unknown error occurred';
                console.error('Error:', errorMessage);
                messageElement.text('Error: ' + errorMessage).css('color', 'red');
            }
        });
    });
});
