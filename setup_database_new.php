<?php
/**
 * Database Setup Script for SQL Server
 * Run this script to create/setup the database and tables
 */

// Include the database configuration
require_once 'config/database.php';

echo "<h2>Setting up Advance Portal Database (SQL Server)</h2>";

try {
    // Get connection variables from the config
    global $serverName, $connectionOptions;
    
    // Test database connection
    echo "<p>✓ Connected to SQL Server database successfully</p>";

    // First ensure the database exists by connecting to master and creating it if needed
    try {
        $masterDsn = "sqlsrv:Server=" . $serverName . ";Database=master";
        $masterPdo = new PDO($masterDsn, 
                           $connectionOptions["Uid"], 
                           $connectionOptions["PWD"],
                           [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        
        // Check if database exists and create if not
        $checkDb = $masterPdo->query("SELECT name FROM sys.databases WHERE name = '" . $connectionOptions["Database"] . "'");
        if ($checkDb->rowCount() == 0) {
            $masterPdo->exec("CREATE DATABASE " . $connectionOptions["Database"]);
            echo "<p>✓ Database '" . $connectionOptions["Database"] . "' created successfully</p>";
        } else {
            echo "<p>✓ Database '" . $connectionOptions["Database"] . "' already exists</p>";
        }
        $masterPdo = null; // Close master connection
    } catch (PDOException $e) {
        echo "<p>⚠ Warning: Could not verify/create database: " . $e->getMessage() . "</p>";
    }

    // Now create tables manually with proper error handling
    echo "<p>Creating tables...</p>";
    
    // Create advance_users table
    $sql = "
    IF OBJECT_ID('advance_users', 'U') IS NULL
    BEGIN
        CREATE TABLE advance_users (
            id INT IDENTITY(1,1) PRIMARY KEY,
            username NVARCHAR(50) NOT NULL UNIQUE,
            email NVARCHAR(100) NOT NULL UNIQUE,
            password NVARCHAR(255) NOT NULL,
            role NVARCHAR(10) NOT NULL DEFAULT 'user',
            status NVARCHAR(10) NOT NULL DEFAULT 'active',
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            
            CONSTRAINT CHK_advance_users_role CHECK (role IN ('admin', 'user')),
            CONSTRAINT CHK_advance_users_status CHECK (status IN ('active', 'inactive'))
        );
    END";
    $pdo->exec($sql);
    echo "<p>✓ Users table created</p>";

    // Create advance_employees table
    $sql = "
    IF OBJECT_ID('advance_employees', 'U') IS NULL
    BEGIN
        CREATE TABLE advance_employees (
            id NVARCHAR(20) PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            status NVARCHAR(10) NOT NULL DEFAULT 'active',
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            
            CONSTRAINT CHK_advance_employees_status CHECK (status IN ('active', 'inactive'))
        );
    END";
    $pdo->exec($sql);
    echo "<p>✓ Employees table created</p>";

    // Create advance_borrowers table
    $sql = "
    IF OBJECT_ID('advance_borrowers', 'U') IS NULL
    BEGIN
        CREATE TABLE advance_borrowers (
            id INT IDENTITY(1,1) PRIMARY KEY,
            application_no NVARCHAR(50) NOT NULL UNIQUE,
            emp_id NVARCHAR(20) NOT NULL,
            name NVARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            outstanding_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            emi DECIMAL(10,2) NOT NULL,
            months INT NOT NULL,
            disbursed_date DATE NOT NULL,
            status NVARCHAR(15) NOT NULL DEFAULT 'active',
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            
            CONSTRAINT CHK_advance_borrowers_status CHECK (status IN ('active', 'cancelled', 'completed'))
        );
    END";
    $pdo->exec($sql);
    echo "<p>✓ Borrowers table created</p>";

    // Create advance_vouchers table
    $sql = "
    IF OBJECT_ID('advance_vouchers', 'U') IS NULL
    BEGIN
        CREATE TABLE advance_vouchers (
            auto_id INT IDENTITY(1,1) PRIMARY KEY,
            id NVARCHAR(20) NOT NULL,
            emp_id NVARCHAR(20) NOT NULL,
            emp_name NVARCHAR(255) NOT NULL,
            voucher_date DATE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            month NVARCHAR(20) NOT NULL,
            application_no NVARCHAR(50) NULL,
            status NVARCHAR(15) NOT NULL DEFAULT 'pending',
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            
            CONSTRAINT CHK_advance_vouchers_status CHECK (status IN ('pending', 'approved', 'rejected', 'processed'))
        );
    END";
    $pdo->exec($sql);
    echo "<p>✓ Vouchers table created</p>";

    // Add foreign key constraints after tables are created
    try {
        $sql = "
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_advance_borrowers_emp_id') AND parent_object_id = OBJECT_ID(N'advance_borrowers'))
        BEGIN
            ALTER TABLE advance_borrowers ADD CONSTRAINT FK_advance_borrowers_emp_id FOREIGN KEY (emp_id) REFERENCES advance_employees(id);
        END";
        $pdo->exec($sql);
        echo "<p>✓ Foreign key constraint added to borrowers table</p>";

        $sql = "
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_advance_vouchers_emp_id') AND parent_object_id = OBJECT_ID(N'advance_vouchers'))
        BEGIN
            ALTER TABLE advance_vouchers ADD CONSTRAINT FK_advance_vouchers_emp_id FOREIGN KEY (emp_id) REFERENCES advance_employees(id);
        END";
        $pdo->exec($sql);
        echo "<p>✓ Foreign key constraint added to vouchers table (emp_id)</p>";

        $sql = "
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_advance_vouchers_application_no') AND parent_object_id = OBJECT_ID(N'advance_vouchers'))
        BEGIN
            ALTER TABLE advance_vouchers ADD CONSTRAINT FK_advance_vouchers_application_no FOREIGN KEY (application_no) REFERENCES advance_borrowers(application_no);
        END";
        $pdo->exec($sql);
        echo "<p>✓ Foreign key constraint added to vouchers table (application_no)</p>";
    } catch (PDOException $e) {
        echo "<p>⚠ Warning adding foreign keys: " . $e->getMessage() . "</p>";
    }

    // Check if admin user exists
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM advance_users WHERE email = 'admin@tecumseh.com'");
    $stmt->execute();
    $result = $stmt->fetch();

    if ($result['count'] == 0) {
        // Create admin user
        $admin_password = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO advance_users (username, email, password, role) VALUES ('admin', 'admin@tecumseh.com', ?, 'admin')");
        $stmt->execute([$admin_password]);
        echo "<p>✓ Admin user created (username: admin, password: admin123)</p>";
    } else {
        echo "<p>✓ Admin user already exists</p>";
        
        // Update admin password
        $admin_password = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE advance_users SET password = ? WHERE email = 'admin@tecumseh.com'");
        $stmt->execute([$admin_password]);
        echo "<p>✓ Admin password updated (password: admin123)</p>";
    }

    echo "<h3>✅ SQL Server database setup completed successfully!</h3>";
    echo "<p>You can now use the application with SQL Server backend.</p>";
    echo "<p><strong>Admin Login:</strong></p>";
    echo "<ul>";
    echo "<li>Username: admin</li>";
    echo "<li>Email: admin@tecumseh.com</li>";
    echo "<li>Password: admin123</li>";
    echo "</ul>";

} catch (PDOException $e) {
    echo "<h3>❌ Error setting up database:</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "<p>Please check your database configuration and try again.</p>";
}
?>
