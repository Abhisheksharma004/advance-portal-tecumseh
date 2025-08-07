<?php
require_once 'config/database.php';

try {
    $pdo = getDB();
    echo "Database connection successful\n";
    
    // Test employees table
    $stmt = $pdo->query("SELECT COUNT(*) FROM employees");
    $count = $stmt->fetchColumn();
    echo "Employees table exists with $count records\n";
    
} catch(Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
