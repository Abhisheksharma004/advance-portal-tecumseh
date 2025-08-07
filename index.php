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
    <script src="login.js"></script>
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
                <span class="input-icon right">
                    <svg width="20" height="20" fill="#7b7b7b" viewBox="0 0 24 24"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                </span>
            </div>
            <div class="options-row">
                <label class="remember-me">
                    <input type="checkbox" name="remember"> Remember me
                </label>
                <a href="#" class="forgot-password">Forgot Password?</a>
            </div>
            <button type="submit" class="signin-btn">Sign In <span class="arrow">→</span></button>
            <div class="footer">
                Design and Develop by <a href="https://www.virosentrepreneurs.com/" target="_blank">Viros Entrepreneurs</a>
            </div>
        </form>
    </div>
</body>
</html>
