<?php
/**
 * API Endpoints for Advance Portal
 * Handles AJAX requests for data operations
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
    error_log("Unexpected output in API: " . $unexpected_output);
}

// Require login for all API calls
if (!isLoggedIn()) {
    sendJsonResponse(false, 'Authentication required');
    exit;
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_employees':
            getEmployees();
            break;
            
        case 'get_borrowers':
            getBorrowers();
            break;
            
        case 'get_vouchers':
            getVouchers();
            break;
            
        case 'get_dashboard_stats':
            getDashboardStats();
            break;
            
        case 'add_employee':
            if ($method === 'POST') {
                addEmployee();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'add_borrower':
            if ($method === 'POST') {
                addBorrower();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'add_voucher':
            if ($method === 'POST') {
                addVoucher();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'update_employee':
            if ($method === 'POST') {
                updateEmployee();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'update_borrower':
            if ($method === 'POST') {
                updateBorrower();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'update_voucher':
            if ($method === 'POST') {
                updateVoucher();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'delete_employee':
            if ($method === 'POST') {
                deleteEmployee();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'delete_borrower':
            if ($method === 'POST') {
                deleteBorrower();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'delete_voucher':
            if ($method === 'POST') {
                deleteVoucher();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        default:
            sendJsonResponse(false, 'Invalid action');
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
    sendJsonResponse(false, 'Server error occurred');
}

/**
 * Get all employees
 */
function getEmployees() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT id, name FROM employees WHERE status = 'active' ORDER BY id");
    $employees = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend
    $result = [];
    foreach ($employees as $emp) {
        $result[$emp['id']] = [
            'id' => $emp['id'],
            'name' => $emp['name']
        ];
    }
    
    sendJsonResponse(true, 'Employees loaded successfully', $result);
}

/**
 * Get all borrowers
 */
function getBorrowers() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT * FROM borrowers WHERE status = 'active' ORDER BY created_at DESC");
    $borrowers = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend
    $result = [];
    foreach ($borrowers as $borrower) {
        $result[$borrower['emp_id']] = [
            'empId' => $borrower['emp_id'],
            'name' => $borrower['name'],
            'amount' => $borrower['amount'],
            'emi' => $borrower['emi'],
            'month' => $borrower['months'],
            'disbursedDate' => $borrower['disbursed_date']
        ];
    }
    
    sendJsonResponse(true, 'Borrowers loaded successfully', $result);
}

/**
 * Get all vouchers
 */
function getVouchers() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT * FROM vouchers ORDER BY created_at DESC");
    $vouchers = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend
    $result = [];
    foreach ($vouchers as $voucher) {
        $result[$voucher['id']] = [
            'id' => $voucher['id'],
            'empId' => $voucher['emp_id'],
            'empName' => $voucher['emp_name'],
            'date' => $voucher['voucher_date'],
            'amount' => $voucher['amount'],
            'month' => $voucher['month']
        ];
    }
    
    sendJsonResponse(true, 'Vouchers loaded successfully', $result);
}

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
    $pdo = getDB();
    
    // Get counts
    $employeeCount = $pdo->query("SELECT COUNT(*) FROM employees WHERE status = 'active'")->fetchColumn();
    $borrowerCount = $pdo->query("SELECT COUNT(*) FROM borrowers WHERE status = 'active'")->fetchColumn();
    $voucherCount = $pdo->query("SELECT COUNT(*) FROM vouchers")->fetchColumn();
    
    // Get outstanding amount
    $outstandingAmount = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM borrowers WHERE status = 'active'")->fetchColumn();
    
    $stats = [
        'totalEmployees' => (int)$employeeCount,
        'activeBorrowers' => (int)$borrowerCount,
        'activeVouchers' => (int)$voucherCount,
        'outstandingAmount' => (float)$outstandingAmount
    ];
    
    sendJsonResponse(true, 'Stats loaded successfully', $stats);
}

/**
 * Add new employee
 */
function addEmployee() {
    $pdo = getDB();
    
    // Validate required fields
    if (empty($_POST['id']) || empty($_POST['name'])) {
        sendJsonResponse(false, 'Employee ID and Name are required');
        return;
    }
    
    $id = trim($_POST['id']);
    $name = trim($_POST['name']);
    
    try {
        // Check if employee ID already exists
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'Employee ID already exists');
            return;
        }
        
        // Insert new employee with only ID and name
        $stmt = $pdo->prepare("INSERT INTO employees (id, name) VALUES (?, ?)");
        $stmt->execute([$id, $name]);
        
        sendJsonResponse(true, 'Employee added successfully', [
            'id' => $id,
            'name' => $name
        ]);
    } catch(PDOException $e) {
        error_log("Add employee error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Add new borrower
 */
function addBorrower() {
    $pdo = getDB();
    
    // Validate required fields
    if (empty($_POST['empId']) || empty($_POST['name']) || empty($_POST['amount']) || empty($_POST['emi']) || empty($_POST['month']) || empty($_POST['disbursedDate'])) {
        sendJsonResponse(false, 'All fields are required');
        return;
    }
    
    $empId = trim($_POST['empId']);
    $name = trim($_POST['name']);
    $amount = floatval($_POST['amount']);
    $emi = floatval($_POST['emi']);
    $months = intval($_POST['month']);
    $disbursedDate = $_POST['disbursedDate'];
    
    try {
        // Check if employee exists
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
        $stmt->execute([$empId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(false, 'Employee ID not found');
            return;
        }
        
        // Check if borrower already exists for this employee
        $stmt = $pdo->prepare("SELECT emp_id FROM borrowers WHERE emp_id = ? AND status = 'active'");
        $stmt->execute([$empId]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'Active advance already exists for this employee');
            return;
        }
        
        // Insert new borrower
        $stmt = $pdo->prepare("INSERT INTO borrowers (emp_id, name, amount, emi, months, disbursed_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$empId, $name, $amount, $emi, $months, $disbursedDate]);
        
        sendJsonResponse(true, 'Borrower added successfully', [
            'empId' => $empId,
            'name' => $name,
            'amount' => $amount,
            'emi' => $emi,
            'month' => $months,
            'disbursedDate' => $disbursedDate
        ]);
    } catch(PDOException $e) {
        error_log("Add borrower error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Add new voucher
 */
function addVoucher() {
    $pdo = getDB();
    
    // Validate required fields
    if (empty($_POST['id']) || empty($_POST['empId']) || empty($_POST['empName']) || empty($_POST['amount']) || empty($_POST['date']) || empty($_POST['month'])) {
        sendJsonResponse(false, 'All fields are required');
        return;
    }
    
    $id = trim($_POST['id']);
    $empId = trim($_POST['empId']);
    $empName = trim($_POST['empName']);
    $amount = floatval($_POST['amount']);
    $date = $_POST['date'];
    $month = trim($_POST['month']);
    
    try {
        // Check if voucher ID already exists
        $stmt = $pdo->prepare("SELECT id FROM vouchers WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'Voucher ID already exists');
            return;
        }
        
        // Insert new voucher
        $stmt = $pdo->prepare("INSERT INTO vouchers (id, emp_id, emp_name, voucher_date, amount, month) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $empId, $empName, $date, $amount, $month]);
        
        sendJsonResponse(true, 'Voucher added successfully', [
            'id' => $id,
            'empId' => $empId,
            'empName' => $empName,
            'date' => $date,
            'amount' => $amount,
            'month' => $month
        ]);
    } catch(PDOException $e) {
        error_log("Add voucher error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Update employee
 */
function updateEmployee() {
    $pdo = getDB();
    
    if (empty($_POST['id']) || empty($_POST['name'])) {
        sendJsonResponse(false, 'Employee ID and Name are required');
        return;
    }
    
    $id = trim($_POST['id']);
    $name = trim($_POST['name']);
    
    try {
        $stmt = $pdo->prepare("UPDATE employees SET name = ? WHERE id = ?");
        $stmt->execute([$name, $id]);
        
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Employee updated successfully');
        } else {
            sendJsonResponse(false, 'Employee not found or no changes made');
        }
    } catch(PDOException $e) {
        error_log("Update employee error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Update borrower
 */
function updateBorrower() {
    $pdo = getDB();
    
    if (empty($_POST['empId']) || empty($_POST['name']) || empty($_POST['amount'])) {
        sendJsonResponse(false, 'Required fields are missing');
        return;
    }
    
    $empId = trim($_POST['empId']);
    $name = trim($_POST['name']);
    $amount = floatval($_POST['amount']);
    $emi = floatval($_POST['emi']);
    $months = intval($_POST['month']);
    $disbursedDate = $_POST['disbursedDate'];
    
    try {
        $stmt = $pdo->prepare("UPDATE borrowers SET name = ?, amount = ?, emi = ?, months = ?, disbursed_date = ? WHERE emp_id = ? AND status = 'active'");
        $stmt->execute([$name, $amount, $emi, $months, $disbursedDate, $empId]);
        
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Borrower updated successfully');
        } else {
            sendJsonResponse(false, 'Borrower not found or no changes made');
        }
    } catch(PDOException $e) {
        error_log("Update borrower error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Update voucher
 */
function updateVoucher() {
    $pdo = getDB();
    
    if (empty($_POST['id']) || empty($_POST['empName']) || empty($_POST['amount'])) {
        sendJsonResponse(false, 'Required fields are missing');
        return;
    }
    
    $id = trim($_POST['id']);
    $empId = trim($_POST['empId']);
    $empName = trim($_POST['empName']);
    $amount = floatval($_POST['amount']);
    $date = $_POST['date'];
    $month = trim($_POST['month']);
    
    try {
        $stmt = $pdo->prepare("UPDATE vouchers SET emp_id = ?, emp_name = ?, voucher_date = ?, amount = ?, month = ? WHERE id = ?");
        $stmt->execute([$empId, $empName, $date, $amount, $month, $id]);
        
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Voucher updated successfully');
        } else {
            sendJsonResponse(false, 'Voucher not found or no changes made');
        }
    } catch(PDOException $e) {
        error_log("Update voucher error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Delete employee
 */
function deleteEmployee() {
    $pdo = getDB();
    
    if (empty($_POST['id'])) {
        sendJsonResponse(false, 'Employee ID is required');
        return;
    }
    
    $id = trim($_POST['id']);
    
    try {
        $stmt = $pdo->prepare("UPDATE employees SET status = 'inactive' WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Employee deleted successfully');
        } else {
            sendJsonResponse(false, 'Employee not found');
        }
    } catch(PDOException $e) {
        error_log("Delete employee error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Delete borrower
 */
function deleteBorrower() {
    $pdo = getDB();
    
    if (empty($_POST['empId'])) {
        sendJsonResponse(false, 'Employee ID is required');
        return;
    }
    
    $empId = trim($_POST['empId']);
    
    try {
        $stmt = $pdo->prepare("UPDATE borrowers SET status = 'cancelled' WHERE emp_id = ? AND status = 'active'");
        $stmt->execute([$empId]);
        
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Borrower deleted successfully');
        } else {
            sendJsonResponse(false, 'Active borrower not found');
        }
    } catch(PDOException $e) {
        error_log("Delete borrower error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Delete voucher
 */
function deleteVoucher() {
    $pdo = getDB();
    
    if (empty($_POST['id'])) {
        sendJsonResponse(false, 'Voucher ID is required');
        return;
    }
    
    $id = trim($_POST['id']);
    
    try {
        $stmt = $pdo->prepare("DELETE FROM vouchers WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Voucher deleted successfully');
        } else {
            sendJsonResponse(false, 'Voucher not found');
        }
    } catch(PDOException $e) {
        error_log("Delete voucher error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred');
    }
}

/**
 * Helper function to send JSON response
 */
function sendJsonResponse($success, $message, $data = null) {
    // Clear any previous output
    if (ob_get_level()) {
        ob_clean();
    }
    
    header('Content-Type: application/json; charset=utf-8');
    
    $response = [
        'success' => $success,
        'message' => $message,
        'data' => $data
    ];
    
    $json = json_encode($response, JSON_UNESCAPED_UNICODE);
    
    if ($json === false) {
        error_log("JSON encoding error: " . json_last_error_msg());
        echo json_encode([
            'success' => false,
            'message' => 'Error encoding response',
            'data' => null
        ]);
    } else {
        echo $json;
    }
    
    exit;
}
?>
