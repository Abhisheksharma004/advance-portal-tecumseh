<?php
/**
 * Logout Handler
 * Destroys user session and redirects to login
 */

require_once 'auth.php';

// Logout user
logoutUser();

// Redirect to login page
header('Location: index.php');
exit();
?>
