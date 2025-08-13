// Enhanced show/hide password functionality
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');
    const eyePath = document.getElementById('eye-path');
    const togglePassword = document.getElementById('toggle-password');
    
    // Eye open icon path (default - password hidden)
    const eyeOpenPath = "M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
    
    // Eye closed icon path (password visible)
    const eyeClosedPath = "M2 4.27L3.28 3 21 20.73 19.73 22l-2.4-2.4C16.24 19.86 14.18 20 12 20c-7 0-11-7-11-7s1.73-2.11 4.65-4.65L2 4.27zM12 14c-1.1 0-2-.9-2-2 0-.35.1-.67.24-.95L7.38 8.19C6.07 9.07 5 10.5 5 12c0 2.76 2.24 5 5 5 .35 0 .69-.06 1-.17l-1.81-1.81C8.67 14.9 8.35 14 8 14zm7.62-1.81C20.93 11.93 22 10.5 22 9c0-2.76-2.24-5-5-5-.35 0-.69.06-1 .17l1.81 1.81c.52.12.84.57.84 1.02 0 .45-.32.9-.84 1.02L19.62 12.19z";
    
    if (passwordInput && eyeIcon && togglePassword) {
        let isPasswordVisible = false;
        
        togglePassword.style.cursor = 'pointer';
        
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isPasswordVisible = !isPasswordVisible;
            
            if (isPasswordVisible) {
                // Show password
                passwordInput.type = 'text';
                eyeIcon.setAttribute('fill', '#2196f3');
                if (eyePath) {
                    eyePath.setAttribute('d', eyeClosedPath);
                }
                togglePassword.setAttribute('title', 'Hide password');
            } else {
                // Hide password
                passwordInput.type = 'password';
                eyeIcon.setAttribute('fill', '#7b7b7b');
                if (eyePath) {
                    eyePath.setAttribute('d', eyeOpenPath);
                }
                togglePassword.setAttribute('title', 'Show password');
            }
        });
        
        // Add hover effect
        togglePassword.addEventListener('mouseenter', function() {
            if (!isPasswordVisible) {
                eyeIcon.setAttribute('fill', '#2196f3');
            }
        });
        
        togglePassword.addEventListener('mouseleave', function() {
            if (!isPasswordVisible) {
                eyeIcon.setAttribute('fill', '#7b7b7b');
            }
        });
        
        // Set initial tooltip
        togglePassword.setAttribute('title', 'Show password');
    }
});

// Login Page JavaScript
// Authentication and login functionality with PHP backend

/**
 * Submit login request to PHP backend
 */
async function submitLogin(email, password) {
    try {
        const response = await fetch('login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
            showErrorMessage('Server error: Invalid response format');
            return;
        }

        const result = JSON.parse(responseText);

        if (result && result.success) {
            showSuccessMessage(result.message + ' Redirecting to dashboard...');
            
            // Safe redirect with explicit check
            const redirectUrl = (result && result.redirect) ? result.redirect : 'dashboard.php';
            
            // Direct redirect
            window.location.href = redirectUrl;
        } else {
            showErrorMessage(result ? result.message : 'Login failed');
        }
    } catch (error) {
        showErrorMessage('Connection error. Please try again.');
    }
}
// Login Page JavaScript
// Authentication and login functionality with PHP backend

/**
 * Submit login request to PHP backend
 */
async function submitLogin(email, password) {
    try {
        const response = await fetch('login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
            console.error('Invalid JSON response:', responseText);
            showErrorMessage('Server error: Invalid response format');
            return;
        }

        const result = JSON.parse(responseText);

        if (result.success) {
            showSuccessMessage(result.message + ' Redirecting to dashboard...');
            
            // Direct redirect - fix the property path
            window.location.href = result.redirect || 'dashboard.php';
        } else {
            showErrorMessage(result.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof SyntaxError) {
            showErrorMessage('Server error: Invalid response format');
        } else {
            showErrorMessage('Connection error. Please try again.');
        }
    }
}

/**
 * Show loading message
 * @param {string} message - Loading message to display
 */
function showLoadingMessage(message) {
    // Remove any existing messages
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'loading-message toast-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <svg width="20" height="20" fill="#17a2b8" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccessMessage(message) {
    // Remove any existing messages
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message toast-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <svg width="20" height="20" fill="#28a745" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    // Remove any existing messages
    removeExistingMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message toast-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <svg width="20" height="20" fill="#dc3545" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

/**
 * Remove existing messages
 */
function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

/**
 * Initialize login page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Handle regular form submission
    const signinForm = document.querySelector('.signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            
            // Validate inputs
            if (!email || !password) {
                showErrorMessage('Please enter both email and password');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showErrorMessage('Please enter a valid email address');
                return;
            }
            
            // Show loading message
            showLoadingMessage('Signing in...');
            
            // Submit login
            submitLogin(email, password);
        });
    }
    
    // Add Enter key support for form fields
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && passwordInput) {
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    signinForm.dispatchEvent(new Event('submit'));
                }
            });
        });
    }
});
