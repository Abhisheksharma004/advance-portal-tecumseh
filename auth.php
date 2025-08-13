<?php
/**
 * Authentication Functions
 * Handles user login, logout, and session management
 */

// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once 'config/database.php';

/**
 * Authenticate user with email and password
 */
function authenticateUser($email, $password) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("SELECT id, email, password, username, role, status FROM users WHERE email = ? AND status = 'active'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Remove password from user data
            unset($user['password']);
            // Set name to username for display
            $user['name'] = $user['username'];
            return $user;
        }
        
        return false;
    } catch(PDOException $e) {
        error_log("Authentication error: " . $e->getMessage());
        return false;
    }
}

/**
 * Create user session
 */
function createUserSession($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

/**
 * Get current user data
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    // Fetch fresh user data from database instead of relying on session
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT id, username, email, role FROM users WHERE id = ? AND status = 'active'");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Update session with fresh data
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['username'];
            $_SESSION['user_role'] = $user['role'];
            
            return [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['username'],
                'role' => $user['role']
            ];
        }
    } catch (Exception $e) {
        error_log("getCurrentUser error: " . $e->getMessage());
    }
    
    // Fallback to session data if database query fails
    return [
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['user_email'],
        'name' => $_SESSION['user_name'],
        'role' => $_SESSION['user_role']
    ];
}

/**
 * Logout user
 */
function logoutUser() {
    session_unset();
    session_destroy();
}

/**
 * Redirect if not logged in
 */
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: index.php');
        exit();
    }
}
?>
