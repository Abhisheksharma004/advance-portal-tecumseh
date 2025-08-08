<?php
/**
 * Database Configuration
 * MySQL connection settings for the Advance Portal
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'eaccess');

// Create connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", 
                   DB_USERNAME, 
                   DB_PASSWORD,
                   [
                       PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                       PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                       PDO::ATTR_EMULATE_PREPARES => false,
                       PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                   ]);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Function to get database connection
function getDB() {
    global $pdo;
    return $pdo;
}
?>
