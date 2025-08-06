class Header {
    constructor(activeLink = '') {
        this.activeLink = activeLink;
        this.username = localStorage.getItem('username');
        this.userId = localStorage.getItem('userId');
    }

    renderAuthButton() {
        if (this.username && this.userId) {
            return `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        ${this.username}
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <li>
                            <a class="dropdown-item" href="user_profile.html?id=${this.userId}">My Profile</a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" onclick="logout()">Sign-Out</a>
                        </li>
                    </ul>
                </li>
            `;
        } else {
            return `
                <li class="nav-item">
                    <a class="nav-link" href="login.html">Login</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="register.html">Register</a>
                </li>
            `;
        }
    }

    render() {
        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="container">
                    <a class="navbar-brand"><img src="css/logo.png" alt="connectify logo" width="50" height="50" class="me-2">Connectify</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            ${this.renderAuthButton()}
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }
}

function logout() {
    // Clear all cookies
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear localStorage
    localStorage.clear();
    
    // Redirect to login page
    window.location.href = 'login.html';
}

function renderHeader(activeLink = '') {
    const header = new Header(activeLink);
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = header.render();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
});