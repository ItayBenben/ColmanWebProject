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
<<<<<<< HEAD
                        <li><a class="dropdown-item" href="user_profile.html?id=${this.userId}">My Profile</a></li>
                        <li><a class="dropdown-item" href="#" onclick="logout()">Sign-Out</a></li>
=======
                        <li>
                            <a class="dropdown-item" href="user_profile.html?id=${this.userId}">My Profile</a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" onclick="logout()">Sign-Out</a>
                        </li>
>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
                    </ul>
                </li>
            `;
        } else {
            return `
<<<<<<< HEAD
                <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
                <li class="nav-item"><a class="nav-link" href="register.html">Register</a></li>
=======
                <li class="nav-item">
                    <a class="nav-link" href="login.html">Login</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="register.html">Register</a>
                </li>
>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
            `;
        }
    }

    render() {
        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="container">
<<<<<<< HEAD
                    <a class="navbar-brand" href="feed.html">
                        <img src="css/logo.png" alt="connectify logo" width="50" height="50" class="me-2">Connectify
                    </a>
=======
                    <a class="navbar-brand" href="feed.html" style="cursor: pointer;"><img src="css/logo.png" alt="connectify logo" width="50" height="50" class="me-2">Connectify</a>
>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
<<<<<<< HEAD

=======
>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            ${this.renderAuthButton()}
                        </ul>
                    </div>
<<<<<<< HEAD

                    <div id="stock-widget" class="ms-3" style="min-width: 250px;">
                        <div class="tradingview-widget-container">
                            <div class="tradingview-widget-container__widget"></div>
                        </div>
                    </div>
=======
>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
                </div>
            </nav>
        `;
    }
}

<<<<<<< HEAD
// Load the TradingView stock widget after DOM is ready
function loadStockWidget() {
    const widgetContainer = document.querySelector('.tradingview-widget-container__widget');
    if (!widgetContainer) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
        "symbols": [
            {
                "proName": "NASDAQ:META",
                "title": "Facebook"
            },
            {
                "proName": "NYSE:SNAP",
                "title": "Snapchat"
            },
            {
                "proName": "NASDAQ:GOOGL",
                "title": "YouTube (Google)"
            },
            {
                "proName": "NYSE:RDDT",
                "title": "Connectify"
            }
        ],
        "theme": "light",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
    });

    widgetContainer.appendChild(script);
}

// Logout function
function logout() {
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.clear();
    window.location.href = 'login.html';
}

// Render header and THEN load stock widget
=======
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

>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
function renderHeader(activeLink = '') {
    const header = new Header(activeLink);
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = header.render();
<<<<<<< HEAD
        loadStockWidget(); // <- call AFTER HTML is injected
=======
>>>>>>> d1f732eff242bb3f80720916b56766583347b89f
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
});