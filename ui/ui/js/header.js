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
                        <li><a class="dropdown-item" href="user_profile.html?id=${this.userId}">My Profile</a></li>
                        <li><a class="dropdown-item" href="#" onclick="logout()">Sign-Out</a></li>
                    </ul>
                </li>
            `;
        } else {
            return `
                <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
                <li class="nav-item"><a class="nav-link" href="register.html">Register</a></li>
            `;
        }
    }

    render() {
        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="container">
                    <a class="navbar-brand" href="feed.html">
                        <img src="css/logo.png" alt="connectify logo" width="50" height="50" class="me-2">Connectify
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            ${this.renderAuthButton()}
                        </ul>
                    </div>

                    <div id="stock-widget" class="ms-3" style="min-width: 250px;">
                        <div class="tradingview-widget-container">
                            <div class="tradingview-widget-container__widget"></div>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }
}

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
    console.log('Logging out user...');
    
    // Clear all cookies
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear localStorage
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.clear();
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    console.log('All authentication data cleared, redirecting to login');
    
    // Force redirect to login page
    window.location.replace('login.html');
}

// Render header and THEN load stock widget
function renderHeader(activeLink = '') {
    const header = new Header(activeLink);
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = header.render();
        loadStockWidget(); // <- call AFTER HTML is injected
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
});