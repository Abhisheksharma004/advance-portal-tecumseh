<?php
/**
 * Database Setup Script
 * Run this script to create/setup the database and tables
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config/database.php';

echo "<h2>Setting up Advance Portal Database</h2>";

try {
    // Test database connection
    echo "<p>✓ Connected to database successfully</p>";
    
    // Check if tables exist and create them if needed
    $tables = [
        'users' => "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        
        'employees' => "CREATE TABLE IF NOT EXISTS employees (
            id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        
        'borrowers' => "CREATE TABLE IF NOT EXISTS borrowers (
            emp_id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            emi DECIMAL(10, 2) NOT NULL,
            months INT NOT NULL,
            disbursed_date DATE NOT NULL,
            status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (emp_id) REFERENCES employees(id) ON DELETE CASCADE
        )",
        
        'vouchers' => "CREATE TABLE IF NOT EXISTS vouchers (
            id VARCHAR(20) PRIMARY KEY,
            emp_id VARCHAR(20) NOT NULL,
            emp_name VARCHAR(255) NOT NULL,
            voucher_date DATE NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            month VARCHAR(20) NOT NULL,
            status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (emp_id) REFERENCES employees(id) ON DELETE CASCADE
        )"
    ];
    
    foreach ($tables as $tableName => $sql) {
        try {
            $pdo->exec($sql);
            echo "<p>✓ Table '$tableName' created/verified successfully</p>";
        } catch (PDOException $e) {
            echo "<p>❌ Error creating table '$tableName': " . $e->getMessage() . "</p>";
        }
    }
    
    // Insert default admin user if not exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = 'admin@tecumseh.com'");
    $stmt->execute();
    $adminExists = $stmt->fetchColumn();
    
    if (!$adminExists) {
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@tecumseh.com', ?, 'admin')");
        $stmt->execute([$adminPassword]);
        echo "<p>✓ Default admin user created</p>";
        echo "<p><strong>Login Credentials:</strong></p>";
        echo "<p>Email: admin@tecumseh.com</p>";
        echo "<p>Password: admin123</p>";
    } else {
        echo "<p>✓ Admin user already exists</p>";
        echo "<p><strong>Use these credentials to login:</strong></p>";
        echo "<p>Email: admin@tecumseh.com</p>";
        echo "<p>Password: admin123</p>";
    }
    
    echo "<h3>Database setup completed successfully!</h3>";
    echo "<p><a href='index.php'>Go to Login Page</a></p>";
    
} catch (PDOException $e) {
    echo "<p>❌ Database setup failed: " . $e->getMessage() . "</p>";
    echo "<p>Please check your database configuration in config/database.php</p>";
}
?>
