<?php
require_once 'auth.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Advance Portal</title>
    <link rel="stylesheet" href="style.css">
    <!-- External JavaScript file -->
</head>
<body>
    <div class="signin-container">
        <form class="signin-form">
            <div class="logo-container">
                <img src="tecumseh.png" alt="Tecumseh Logo" class="logo">
            </div>
            <h2 class="portal-title">Advance Portal</h2>
            <p class="subtitle">Please sign in to your account</p>
            <div class="input-group">
                <span class="input-icon">
                    <svg width="20" height="20" fill="#7b7b7b" viewBox="0 0 24 24"><path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
                </span>
                <input type="email" id="email" name="email" placeholder="Email Address" required>
            </div>
            <div class="input-group">
                <span class="input-icon">
                    <svg width="20" height="20" fill="#7b7b7b" viewBox="0 0 24 24"><path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-7V7a6 6 0 0 0-12 0v3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-8-3a4 4 0 0 1 8 0v3H6V7z"/></svg>
                </span>
                <input type="password" id="password" name="password" placeholder="Password" required>
                <span class="input-icon right" id="toggle-password" style="cursor:pointer;" title="Toggle password visibility">
                    <svg id="eye-icon" width="20" height="20" fill="#7b7b7b" viewBox="0 0 24 24">
                        <path id="eye-path" d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                    </svg>
                </span>
            </div>
            <div class="options-row">
                <!-- <label class="remember-me">
                    <input type="checkbox" name="remember"> Remember me
                </label>
                <a href="#" class="forgot-password">Forgot Password?</a> -->
            </div>
            <button type="submit" class="signin-btn">Sign In <span class="arrow">→</span></button>
            <div class="footer">
                Design and Develop by <a href="https://www.virosentrepreneurs.com/" target="_blank">Viros Entrepreneurs</a>
            </div>
        </form>
    </div>
    <script src="login.js"></script>
    <script>
        // Enhanced show/hide password functionality
        window.addEventListener('load', function() {
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
            }
        });
    </script>
</body>
</html>
