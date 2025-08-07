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

// Date conversion functions
function convertDateToDDMMYYYY($dateString) {
    if (empty($dateString)) return $dateString;
    
    // Check if date is already in DD-MM-YYYY format
    if (preg_match('/^\d{2}-\d{2}-\d{4}$/', $dateString)) {
        return $dateString;
    }
    
    // Convert from YYYY-MM-DD to DD-MM-YYYY
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
        $parts = explode('-', $dateString);
        return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    }
    
    // Try to parse as Date and format
    $timestamp = strtotime($dateString);
    if ($timestamp !== false) {
        return date('d-m-Y', $timestamp);
    }
    
    return $dateString;
}

function convertDateToYYYYMMDD($dateString) {
    if (empty($dateString)) return $dateString;
    
    // Check if date is already in YYYY-MM-DD format
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
        return $dateString;
    }
    
    // Convert from DD-MM-YYYY to YYYY-MM-DD
    if (preg_match('/^\d{2}-\d{2}-\d{4}$/', $dateString)) {
        $parts = explode('-', $dateString);
        return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    }
    
    // Try to parse as Date and format
    $timestamp = strtotime($dateString);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp);
    }
    
    return $dateString;
}

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
            
        case 'import_employees':
            if ($method === 'POST') {
                importEmployees();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'import_borrowers':
            if ($method === 'POST') {
                importBorrowers();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'import_vouchers':
            if ($method === 'POST') {
                importVouchers();
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
    $stmt = $pdo->query("SELECT id, name, created_at FROM employees WHERE status = 'active' ORDER BY id");
    $employees = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend
    $result = [];
    foreach ($employees as $emp) {
        $result[$emp['id']] = [
            'id' => $emp['id'],
            'name' => $emp['name'],
            'created_at' => $emp['created_at']
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
            'disbursedDate' => convertDateToDDMMYYYY($borrower['disbursed_date']),
            'created_at' => $borrower['created_at']
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
            'date' => convertDateToDDMMYYYY($voucher['voucher_date']),
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
        
        // Get the created_at timestamp
        $stmt = $pdo->prepare("SELECT created_at FROM employees WHERE id = ?");
        $stmt->execute([$id]);
        $createdAt = $stmt->fetchColumn();
        
        sendJsonResponse(true, 'Employee added successfully', [
            'id' => $id,
            'name' => $name,
            'created_at' => $createdAt
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
    $disbursedDate = convertDateToYYYYMMDD($_POST['disbursedDate']);
    
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
        
        // Get the created_at timestamp
        $stmt = $pdo->prepare("SELECT created_at FROM borrowers WHERE emp_id = ? AND status = 'active'");
        $stmt->execute([$empId]);
        $createdAt = $stmt->fetchColumn();
        
        sendJsonResponse(true, 'Borrower added successfully', [
            'empId' => $empId,
            'name' => $name,
            'amount' => $amount,
            'emi' => $emi,
            'month' => $months,
            'disbursedDate' => convertDateToDDMMYYYY($disbursedDate),
            'created_at' => $createdAt
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
    $date = convertDateToYYYYMMDD($_POST['date']);
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
    $disbursedDate = convertDateToYYYYMMDD($_POST['disbursedDate']);
    
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
    $date = convertDateToYYYYMMDD($_POST['date']);
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

/**
 * Import multiple employees from Excel data
 */
function importEmployees() {
    $pdo = getDB();
    
    // Get JSON data from POST body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['employees']) || !is_array($data['employees'])) {
        sendJsonResponse(false, 'Invalid employee data provided');
        return;
    }
    
    $employees = $data['employees'];
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        foreach ($employees as $index => $employee) {
            // Validate required fields
            if (empty($employee['id']) || empty($employee['name'])) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID and Name are required";
                $errorCount++;
                continue;
            }
            
            $id = trim($employee['id']);
            $name = trim($employee['name']);
            
            // Check if employee ID already exists
            $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$id' already exists";
                $errorCount++;
                continue;
            }
            
            // Insert employee
            $stmt = $pdo->prepare("INSERT INTO employees (id, name) VALUES (?, ?)");
            if ($stmt->execute([$id, $name])) {
                $successCount++;
            } else {
                $errors[] = "Row " . ($index + 1) . ": Failed to insert employee '$id'";
                $errorCount++;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $message = "Import completed: $successCount employees imported";
        if ($errorCount > 0) {
            $message .= ", $errorCount errors occurred";
        }
        
        sendJsonResponse(true, $message, [
            'successCount' => $successCount,
            'errorCount' => $errorCount,
            'errors' => $errors
        ]);
        
    } catch(PDOException $e) {
        // Rollback transaction on error
        $pdo->rollback();
        error_log("Import employees error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred during import');
    }
}

/**
 * Import multiple borrowers from Excel data
 */
function importBorrowers() {
    $pdo = getDB();
    
    // Get JSON data from POST body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['borrowers']) || !is_array($data['borrowers'])) {
        sendJsonResponse(false, 'Invalid borrower data provided');
        return;
    }
    
    $borrowers = $data['borrowers'];
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        foreach ($borrowers as $index => $borrower) {
            // Validate required fields
            if (empty($borrower['empId']) || empty($borrower['name']) || empty($borrower['amount']) || 
                empty($borrower['emi']) || empty($borrower['month']) || empty($borrower['disbursedDate'])) {
                $errors[] = "Row " . ($index + 1) . ": All fields are required";
                $errorCount++;
                continue;
            }
            
            $empId = trim($borrower['empId']);
            $name = trim($borrower['name']);
            $amount = floatval($borrower['amount']);
            $emi = floatval($borrower['emi']);
            $months = intval($borrower['month']);
            $disbursedDate = convertDateToYYYYMMDD($borrower['disbursedDate']);
            
            // Check if employee exists
            $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
            $stmt->execute([$empId]);
            if (!$stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' not found";
                $errorCount++;
                continue;
            }
            
            // Check if borrower already exists for this employee
            $stmt = $pdo->prepare("SELECT emp_id FROM borrowers WHERE emp_id = ? AND status = 'active'");
            $stmt->execute([$empId]);
            if ($stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Active advance already exists for employee '$empId'";
                $errorCount++;
                continue;
            }
            
            // Insert borrower
            $stmt = $pdo->prepare("INSERT INTO borrowers (emp_id, name, amount, emi, months, disbursed_date) VALUES (?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$empId, $name, $amount, $emi, $months, $disbursedDate])) {
                $successCount++;
            } else {
                $errors[] = "Row " . ($index + 1) . ": Failed to insert borrower '$empId'";
                $errorCount++;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $message = "Import completed: $successCount borrowers imported";
        if ($errorCount > 0) {
            $message .= ", $errorCount errors occurred";
        }
        
        sendJsonResponse(true, $message, [
            'successCount' => $successCount,
            'errorCount' => $errorCount,
            'errors' => $errors
        ]);
        
    } catch(PDOException $e) {
        // Rollback transaction on error
        $pdo->rollback();
        error_log("Import borrowers error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred during import');
    }
}

/**
 * Import multiple vouchers from Excel data
 */
function importVouchers() {
    $pdo = getDB();
    
    // Get JSON data from POST body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['vouchers']) || !is_array($data['vouchers'])) {
        sendJsonResponse(false, 'Invalid voucher data provided');
        return;
    }
    
    $vouchers = $data['vouchers'];
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        foreach ($vouchers as $index => $voucher) {
            // Validate required fields
            if (empty($voucher['id']) || empty($voucher['empId']) || empty($voucher['empName']) || 
                empty($voucher['date']) || empty($voucher['amount']) || empty($voucher['month'])) {
                $errors[] = "Row " . ($index + 1) . ": All fields are required";
                $errorCount++;
                continue;
            }
            
            $id = trim($voucher['id']);
            $empId = trim($voucher['empId']);
            $empName = trim($voucher['empName']);
            $date = convertDateToYYYYMMDD($voucher['date']);
            $amount = floatval($voucher['amount']);
            $month = trim($voucher['month']);
            
            // Check if voucher ID already exists
            $stmt = $pdo->prepare("SELECT id FROM vouchers WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Voucher ID '$id' already exists";
                $errorCount++;
                continue;
            }
            
            // Check if employee exists
            $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
            $stmt->execute([$empId]);
            if (!$stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' not found";
                $errorCount++;
                continue;
            }
            
            // Insert voucher
            $stmt = $pdo->prepare("INSERT INTO vouchers (id, emp_id, emp_name, voucher_date, amount, month) VALUES (?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$id, $empId, $empName, $date, $amount, $month])) {
                $successCount++;
            } else {
                $errors[] = "Row " . ($index + 1) . ": Failed to insert voucher '$id'";
                $errorCount++;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $message = "Import completed: $successCount vouchers imported";
        if ($errorCount > 0) {
            $message .= ", $errorCount errors occurred";
        }
        
        sendJsonResponse(true, $message, [
            'successCount' => $successCount,
            'errorCount' => $errorCount,
            'errors' => $errors
        ]);
        
    } catch(PDOException $e) {
        // Rollback transaction on error
        $pdo->rollback();
        error_log("Import vouchers error: " . $e->getMessage());
        sendJsonResponse(false, 'Database error occurred during import');
    }
}
?>
