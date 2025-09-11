<?php
/**
 * Database Configuration
 * SQL Server connection settings for the Advance Portal
 */

// SQL Server connection settings
$serverName = "MSI\SQLEXPRESS";
$port = 1433;
$connectionOptions = [
    "Database"=>"eaccess",
    "Uid"=>"",
    "PWD"=>"",
    "TrustServerCertificate"=>true, // Add this for SSL issues
    "LoginTimeout"=>30,
    "ConnectRetryCount"=>3
];

// Make variables globally accessible
global $serverName, $connectionOptions, $port;

// Create connection using sqlsrv functions
// For named instances like SQLEXPRESS, try without port first
$conn = sqlsrv_connect($serverName, $connectionOptions);

// If connection fails, try with port
if($conn == false) {
    $serverWithPort = $serverName . "," . $port;
    $conn = sqlsrv_connect($serverWithPort, $connectionOptions);
}

if($conn == false) {
    die(print_r( sqlsrv_errors(), true));
} else {
    //echo 'Connection Success Full<br><br>';
}

// For backward compatibility, also create a PDO connection wrapper
try {
    // Try connection without port first (recommended for named instances)
    $dsn = "sqlsrv:Server=" . $serverName . ";Database=" . $connectionOptions["Database"] . ";TrustServerCertificate=1";
    
    $pdo = new PDO($dsn, 
                   $connectionOptions["Uid"], 
                   $connectionOptions["PWD"],
                   [
                       PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                       PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                       PDO::ATTR_EMULATE_PREPARES => false
                   ]);
} catch(PDOException $e) {
    // If that fails, try with port
    try {
        $serverWithPort = $serverName . "," . $port;
        $dsn = "sqlsrv:Server=" . $serverWithPort . ";Database=" . $connectionOptions["Database"] . ";TrustServerCertificate=1";
        
        $pdo = new PDO($dsn, 
                       $connectionOptions["Uid"], 
                       $connectionOptions["PWD"],
                       [
                           PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                           PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                           PDO::ATTR_EMULATE_PREPARES => false
                       ]);
    } catch(PDOException $e2) {
        die("PDO Connection failed: " . $e->getMessage() . " and " . $e2->getMessage());
    }
}

// Function to get database connection (PDO for backward compatibility)
function getDB() {
    global $pdo;
    return $pdo;
}

// Function to get native SQL Server connection
function getSQLSrvConnection() {
    global $conn;
    return $conn;
}

// Helper function for SQL Server specific date formatting
function formatDateForSQLServer($date) {
    if ($date instanceof DateTime) {
        return $date->format('Y-m-d H:i:s');
    }
    return $date;
}

// Helper function to handle IDENTITY columns in SQL Server
function getLastInsertId($connection = null, $table = null) {
    if ($connection === null) {
        global $pdo;
        $connection = $pdo;
    }
    
    if ($connection instanceof PDO) {
        $stmt = $connection->query("SELECT @@IDENTITY as last_id");
        $result = $stmt->fetch();
        return $result['last_id'];
    } else {
        // For sqlsrv connection
        $stmt = sqlsrv_query($connection, "SELECT @@IDENTITY as last_id");
        if ($stmt === false) {
            return false;
        }
        $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        return $result['last_id'];
    }
}
?>
