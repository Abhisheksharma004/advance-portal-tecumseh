<?php
/**
 * Login Handler
 * Processes login form submissions
 */

// Set content type to JSON and prevent any HTML output
header('Content-Type: application/json; charset=utf-8');

// Turn off error display to prevent HTML errors in JSON
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

require_once 'auth.php';

// Clean any unexpected output
$unexpected_output = ob_get_clean();
if (!empty($unexpected_output)) {
    error_log("Unexpected output in login.php: " . $unexpected_output);
}

// Handle POST requests only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Invalid request method');
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Check for JSON decode errors
if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse(false, 'Invalid JSON data');
}

// Validate input
if (!isset($input['email']) || !isset($input['password'])) {
    sendJsonResponse(false, 'Email and password are required');
}

$email = trim($input['email']);
$password = trim($input['password']);

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(false, 'Invalid email format');
}

// Validate password
if (empty($password)) {
    sendJsonResponse(false, 'Password is required');
}

// Attempt authentication
$user = authenticateUser($email, $password);

if ($user) {
    // Create session
    createUserSession($user);
    
    // Log successful login
    error_log("Successful login for user: " . $email);
    
    sendJsonResponse(true, 'Login successful', [
        'user' => $user,
        'redirect' => 'dashboard.php'
    ]);
} else {
    // Log failed login attempt
    error_log("Failed login attempt for email: " . $email);
    
    // Check if user exists but password is wrong, or user doesn't exist
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT id, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $userExists = $stmt->fetch();
    
    if ($userExists) {
        if ($userExists['status'] !== 'active') {
            sendJsonResponse(false, 'Account is not active. Please contact administrator.');
        } else {
            sendJsonResponse(false, 'Invalid password. Please check your password and try again.');
        }
    } else {
        sendJsonResponse(false, 'No account found with this email address. Please check your email or contact administrator.');
    }
}
?>
