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
            
            // Redirect after success
            setTimeout(() => {
                window.location.href = result.data.redirect;
            }, 1500);
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
