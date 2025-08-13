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
            
        case 'get_borrower_history':
            getBorrowerHistory();
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
            
        case 'update_email':
            if ($method === 'POST') {
                updateUserEmail();
            } else {
                sendJsonResponse(false, 'Method not allowed');
            }
            break;
            
        case 'change_password':
            if ($method === 'POST') {
                changeUserPassword();
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
    // Include both active and completed borrowers to show completion status
    $stmt = $pdo->query("SELECT * FROM borrowers WHERE status IN ('active', 'completed') ORDER BY 
        CASE WHEN status = 'active' THEN 1 ELSE 2 END, created_at DESC");
    $borrowers = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend - now using unique ID as key
    $result = [];
    foreach ($borrowers as $borrower) {
        $result[$borrower['id']] = [
            'id' => $borrower['id'],
            'empId' => $borrower['emp_id'],
            'name' => $borrower['name'],
            'amount' => $borrower['amount'], // Original advance amount
            'outstandingAmount' => $borrower['outstanding_amount'], // Current outstanding amount
            'emi' => $borrower['emi'],
            'month' => $borrower['months'],
            'disbursedDate' => convertDateToDDMMYYYY($borrower['disbursed_date']),
            'status' => $borrower['status'],
            'applicationNo' => $borrower['application_no'],
            'created_at' => $borrower['created_at']
        ];
    }
    
    sendJsonResponse(true, 'Borrowers loaded successfully', $result);
}

/**
 * Get borrowing history for a specific employee
 */
function getBorrowerHistory() {
    $pdo = getDB();
    
    // Validate required parameter
    if (empty($_GET['empId'])) {
        sendJsonResponse(false, 'Employee ID is required');
        return;
    }
    
    $empId = trim($_GET['empId']);
    
    try {
        // Get employee details
        $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ?");
        $stmt->execute([$empId]);
        $employee = $stmt->fetch();
        
        if (!$employee) {
            sendJsonResponse(false, 'Employee not found');
            return;
        }
        
        // Get all borrowing records for this employee (all statuses)
        $stmt = $pdo->prepare("SELECT * FROM borrowers WHERE emp_id = ? ORDER BY created_at DESC");
        $stmt->execute([$empId]);
        $borrowingHistory = $stmt->fetchAll();
        
        // Format the history data
        $historyData = [];
        foreach ($borrowingHistory as $record) {
            $historyData[] = [
                'id' => $record['id'],
                'amount' => $record['amount'],
                'outstandingAmount' => $record['outstanding_amount'],
                'emi' => $record['emi'],
                'months' => $record['months'],
                'disbursedDate' => convertDateToDDMMYYYY($record['disbursed_date']),
                'status' => $record['status'],
                'applicationNo' => $record['application_no'],
                'created_at' => $record['created_at'],
                'updated_at' => $record['updated_at']
            ];
        }
        
        // Calculate summary
        $totalBorrowings = count($historyData);
        $activeBorrowings = array_filter($historyData, function($record) {
            return $record['status'] === 'active';
        });
        $completedBorrowings = array_filter($historyData, function($record) {
            return $record['status'] === 'completed';
        });
        $totalOutstanding = array_sum(array_column($activeBorrowings, 'outstandingAmount'));
        
        $result = [
            'employee' => [
                'id' => $employee['id'],
                'name' => $employee['name'],
                'status' => $employee['status']
            ],
            'summary' => [
                'totalBorrowings' => $totalBorrowings,
                'activeBorrowings' => count($activeBorrowings),
                'completedBorrowings' => count($completedBorrowings),
                'totalOutstanding' => $totalOutstanding
            ],
            'history' => $historyData
        ];
        
        sendJsonResponse(true, 'Borrowing history loaded successfully', $result);
        
    } catch (Exception $e) {
        error_log("Get borrower history error: " . $e->getMessage());
        sendJsonResponse(false, 'Error loading borrowing history');
    }
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
        $result[$voucher['auto_id']] = [
            'auto_id' => $voucher['auto_id'],
            'id' => $voucher['id'],
            'empId' => $voucher['emp_id'],
            'empName' => $voucher['emp_name'],
            'date' => convertDateToDDMMYYYY($voucher['voucher_date']),
            'amount' => $voucher['amount'],
            'month' => $voucher['month'],
            'applicationNo' => $voucher['application_no']
        ];
    }
    
    sendJsonResponse(true, 'Vouchers loaded successfully', $result);
}

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
    try {
        $pdo = getDB();
        
        // Get counts
        $employeeCount = $pdo->query("SELECT COUNT(*) FROM employees WHERE status = 'active'")->fetchColumn();
        $borrowerCount = $pdo->query("SELECT COUNT(*) FROM borrowers WHERE status = 'active'")->fetchColumn();
        $voucherCount = $pdo->query("SELECT COUNT(*) FROM vouchers")->fetchColumn();
        
        // Get outstanding amount - use 'outstanding_amount' column
        $outstandingAmount = $pdo->query("SELECT COALESCE(SUM(outstanding_amount), 0) FROM borrowers WHERE status = 'active'")->fetchColumn();
        
        $stats = [
            'totalEmployees' => (int)$employeeCount,
            'activeBorrowers' => (int)$borrowerCount,
            'activeVouchers' => (int)$voucherCount,
            'outstandingAmount' => (float)$outstandingAmount
        ];
        
        sendJsonResponse(true, 'Stats loaded successfully', $stats);
    } catch (Exception $e) {
        error_log("Dashboard stats error: " . $e->getMessage());
        sendJsonResponse(false, 'Error loading dashboard stats: ' . $e->getMessage());
    }
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
    $applicationNo = trim($_POST['applicationNo'] ?? '');
    
    try {
        // Check if employee exists
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
        $stmt->execute([$empId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(false, 'Employee ID not found');
            return;
        }
        
        // If application number is provided, check if it's unique
        if (!empty($applicationNo)) {
            $stmt = $pdo->prepare("SELECT id FROM borrowers WHERE application_no = ?");
            $stmt->execute([$applicationNo]);
            if ($stmt->fetch()) {
                sendJsonResponse(false, 'Application number already exists');
                return;
            }
        }
        
        // Allow multiple borrowings per employee - remove the restriction
        // Check if there's already an active borrowing (warn but allow)
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM borrowers WHERE emp_id = ? AND status = 'active'");
        $stmt->execute([$empId]);
        $activeCount = $stmt->fetchColumn();
        
        // Insert new borrower (outstanding_amount will be same as amount initially)
        if (!empty($applicationNo)) {
            $stmt = $pdo->prepare("INSERT INTO borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date, application_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $disbursedDate, $applicationNo]);
        } else {
            // Auto-generate application number based on borrower ID
            $stmt = $pdo->prepare("INSERT INTO borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $disbursedDate]);
            
            // Get the inserted record ID and update with application number
            $borrowerId = $pdo->lastInsertId();
            $autoAppNo = 'APP' . str_pad($borrowerId, 6, '0', STR_PAD_LEFT);
            $stmt = $pdo->prepare("UPDATE borrowers SET application_no = ? WHERE id = ?");
            $stmt->execute([$autoAppNo, $borrowerId]);
        }
        
        // Get the created borrower details
        $stmt = $pdo->prepare("SELECT * FROM borrowers WHERE id = ?");
        $stmt->execute([$borrowerId]);
        $borrower = $stmt->fetch();
        
        $message = 'Borrower added successfully';
        if ($activeCount > 0) {
            $message .= ' (Note: This employee already has ' . $activeCount . ' active advance(s))';
        }
        
        sendJsonResponse(true, $message, [
            'id' => $borrower['id'],
            'empId' => $borrower['emp_id'],
            'name' => $borrower['name'],
            'amount' => $borrower['amount'],
            'outstandingAmount' => $borrower['outstanding_amount'],
            'emi' => $borrower['emi'],
            'month' => $borrower['months'],
            'disbursedDate' => convertDateToDDMMYYYY($borrower['disbursed_date']),
            'status' => $borrower['status'],
            'applicationNo' => $borrower['application_no'],
            'created_at' => $borrower['created_at']
        ]);
        $stmt->execute([$empId]);
        $createdAt = $stmt->fetchColumn();
        
        sendJsonResponse(true, 'Borrower added successfully', [
            'empId' => $empId,
            'name' => $name,
            'amount' => $amount,
            'outstandingAmount' => $amount, // Initially same as advance amount
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
    $applicationNo = trim($_POST['applicationNo'] ?? '');
    
    try {
        // Begin transaction for data consistency
        $pdo->beginTransaction();
        
        // Check if employee exists
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
        $stmt->execute([$empId]);
        if (!$stmt->fetch()) {
            $pdo->rollBack();
            sendJsonResponse(false, "Employee ID '$empId' not found. Please verify the employee ID.");
            return;
        }
        
        // Insert new voucher with application number
        $stmt = $pdo->prepare("INSERT INTO vouchers (id, emp_id, emp_name, voucher_date, amount, month, application_no) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $empId, $empName, $date, $amount, $month, $applicationNo]);
        
        // Get the auto-generated ID
        $autoId = $pdo->lastInsertId();
        
        $borrowerUpdate = null;
        
        if (!empty($applicationNo)) {
            // Find the specific borrower record by application number
            $borrowerStmt = $pdo->prepare("SELECT id, amount, outstanding_amount FROM borrowers WHERE application_no = ? AND status = 'active'");
            $borrowerStmt->execute([$applicationNo]);
            $borrower = $borrowerStmt->fetch();
            
            if ($borrower) {
                $borrowerId = $borrower['id'];
                $originalAmount = floatval($borrower['amount']);
                $currentOutstanding = floatval($borrower['outstanding_amount']);
                $newOutstanding = $currentOutstanding - $amount;
                
                if ($newOutstanding <= 0) {
                    // Mark this specific borrower record as completed
                    $updateStmt = $pdo->prepare("UPDATE borrowers SET outstanding_amount = 0, status = 'completed' WHERE id = ?");
                    $updateStmt->execute([$borrowerId]);
                    $borrowerUpdate = ['status' => 'completed', 'originalAmount' => $originalAmount, 'newOutstanding' => 0, 'reducedBy' => $amount, 'applicationNo' => $applicationNo];
                } else {
                    // Reduce only the outstanding amount for this specific borrower
                    $updateStmt = $pdo->prepare("UPDATE borrowers SET outstanding_amount = ? WHERE id = ?");
                    $updateStmt->execute([$newOutstanding, $borrowerId]);
                    $borrowerUpdate = ['status' => 'active', 'originalAmount' => $originalAmount, 'newOutstanding' => $newOutstanding, 'reducedBy' => $amount, 'applicationNo' => $applicationNo];
                }
            }
        } else {
            // Fallback: Check if employee has any active borrower record (for backward compatibility)
            $borrowerStmt = $pdo->prepare("SELECT id, amount, outstanding_amount FROM borrowers WHERE emp_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1");
            $borrowerStmt->execute([$empId]);
            $borrower = $borrowerStmt->fetch();
            
            if ($borrower) {
                $borrowerId = $borrower['id'];
                $originalAmount = floatval($borrower['amount']);
                $currentOutstanding = floatval($borrower['outstanding_amount']);
                $newOutstanding = $currentOutstanding - $amount;
                
                if ($newOutstanding <= 0) {
                    // Mark borrower as completed
                    $updateStmt = $pdo->prepare("UPDATE borrowers SET outstanding_amount = 0, status = 'completed' WHERE id = ?");
                    $updateStmt->execute([$borrowerId]);
                    $borrowerUpdate = ['status' => 'completed', 'originalAmount' => $originalAmount, 'newOutstanding' => 0, 'reducedBy' => $amount];
                } else {
                    // Reduce only the outstanding amount
                    $updateStmt = $pdo->prepare("UPDATE borrowers SET outstanding_amount = ? WHERE id = ?");
                    $updateStmt->execute([$newOutstanding, $borrowerId]);
                    $borrowerUpdate = ['status' => 'active', 'originalAmount' => $originalAmount, 'newOutstanding' => $newOutstanding, 'reducedBy' => $amount];
                }
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $response = [
            'auto_id' => $autoId,
            'id' => $id,
            'empId' => $empId,
            'empName' => $empName,
            'date' => convertDateToDDMMYYYY($date),
            'amount' => $amount,
            'month' => $month,
            'applicationNo' => $applicationNo
        ];
        
        // Add borrower update info if applicable
        if ($borrowerUpdate) {
            $response['borrowerUpdate'] = $borrowerUpdate;
            $message = 'Voucher added successfully. ';
            if (!empty($applicationNo)) {
                $message .= "Advance payment of ₹" . number_format($amount, 2) . " applied to application {$applicationNo}.";
            } else {
                $message .= "Borrower amount reduced by ₹" . number_format($amount, 2) . ".";
            }
            if ($borrowerUpdate['status'] === 'completed') {
                $message .= ' Advance loan completed!';
            }
        } else {
            $message = 'Voucher added successfully';
        }
        
        sendJsonResponse(true, $message, $response);
        
    } catch(PDOException $e) {
        // Rollback transaction on error
        $pdo->rollback();
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
    
    if (!isset($_POST['id']) || !isset($_POST['empId']) || !isset($_POST['name']) || !isset($_POST['amount']) || !isset($_POST['emi']) || !isset($_POST['month']) || !isset($_POST['disbursedDate'])) {
        sendJsonResponse(false, 'Required fields are missing: id, empId, name, amount, emi, month, disbursedDate');
        return;
    }
    
    if (trim($_POST['empId']) === '' || trim($_POST['name']) === '' || trim($_POST['amount']) === '' || trim($_POST['disbursedDate']) === '') {
        sendJsonResponse(false, 'Employee ID, name, amount, and disbursed date cannot be empty');
        return;
    }
    
    $id = intval($_POST['id']);
    $empId = trim($_POST['empId']);
    $name = trim($_POST['name']);
    $amount = floatval($_POST['amount']);
    $emi = floatval($_POST['emi']);
    $months = intval($_POST['month']);
    $disbursedDate = convertDateToYYYYMMDD($_POST['disbursedDate']);
    
    try {
        // Get current record to calculate new outstanding amount using the specific ID
        $stmt = $pdo->prepare("SELECT amount, outstanding_amount FROM borrowers WHERE id = ? AND status = 'active'");
        $stmt->execute([$id]);
        $currentRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$currentRecord) {
            sendJsonResponse(false, 'Active borrower record not found');
            return;
        }
        
        // Calculate new outstanding amount
        $currentAmount = floatval($currentRecord['amount']);
        $currentOutstanding = floatval($currentRecord['outstanding_amount']);
        
        // If the main amount changed, adjust outstanding proportionally
        if ($currentAmount != $amount) {
            if ($currentAmount > 0) {
                $ratio = $currentOutstanding / $currentAmount;
                $newOutstanding = $amount * $ratio;
            } else {
                $newOutstanding = $amount; // If current amount was 0, set outstanding to new amount
            }
        } else {
            $newOutstanding = $currentOutstanding; // Keep current outstanding if amount didn't change
        }
        
        // Update the record with new outstanding amount using the specific ID
        $stmt = $pdo->prepare("UPDATE borrowers SET emp_id = ?, name = ?, amount = ?, outstanding_amount = ?, emi = ?, months = ?, disbursed_date = ? WHERE id = ? AND status = 'active'");
        $stmt->execute([$empId, $name, $amount, $newOutstanding, $emi, $months, $disbursedDate, $id]);
        
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
    
    if (empty($_POST['auto_id']) || empty($_POST['empName']) || empty($_POST['amount'])) {
        sendJsonResponse(false, 'Required fields are missing');
        return;
    }
    
    $autoId = intval($_POST['auto_id']);
    $id = trim($_POST['id']);
    $empId = trim($_POST['empId']);
    $empName = trim($_POST['empName']);
    $amount = floatval($_POST['amount']);
    $date = convertDateToYYYYMMDD($_POST['date']);
    $month = trim($_POST['month']);
    
    try {
        $stmt = $pdo->prepare("UPDATE vouchers SET id = ?, emp_id = ?, emp_name = ?, voucher_date = ?, amount = ?, month = ? WHERE auto_id = ?");
        $stmt->execute([$id, $empId, $empName, $date, $amount, $month, $autoId]);
        
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
    
    // Updated to use borrower ID instead of employee ID
    if (empty($_POST['id'])) {
        sendJsonResponse(false, 'Borrower ID is required');
        return;
    }
    
    $borrowerId = trim($_POST['id']);
    
    try {
        // Update status to cancelled for the specific borrower record
        $stmt = $pdo->prepare("UPDATE borrowers SET status = 'cancelled' WHERE id = ? AND status = 'active'");
        $stmt->execute([$borrowerId]);
        
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
    
    if (empty($_POST['auto_id'])) {
        sendJsonResponse(false, 'Voucher ID is required');
        return;
    }
    
    $autoId = intval($_POST['auto_id']);
    
    try {
        $stmt = $pdo->prepare("DELETE FROM vouchers WHERE auto_id = ?");
        $stmt->execute([$autoId]);
        
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
        
        // Log the full error for debugging
        error_log("Import employees error: " . $e->getMessage());
        
        // Provide user-friendly error message
        $userMessage = 'Database error occurred during employee import';
        $errorMessage = $e->getMessage();
        
        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            $userMessage = 'Duplicate employee ID found - employee IDs must be unique';
        } elseif (strpos($errorMessage, 'Data too long') !== false) {
            $userMessage = 'Employee name or ID too long for database fields';
        }
        
        sendJsonResponse(false, $userMessage, [
            'errorType' => 'database',
            'errorCode' => $e->getCode(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
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
            $applicationNo = trim($borrower['applicationNo'] ?? '');
            
            // Check if employee exists
            $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
            $stmt->execute([$empId]);
            if (!$stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' not found";
                $errorCount++;
                continue;
            }
            
            // If application number is provided, check if it's unique
            if (!empty($applicationNo)) {
                $stmt = $pdo->prepare("SELECT id FROM borrowers WHERE application_no = ?");
                $stmt->execute([$applicationNo]);
                if ($stmt->fetch()) {
                    $errors[] = "Row " . ($index + 1) . ": Application number '$applicationNo' already exists";
                    $errorCount++;
                    continue;
                }
            }
            
            // Allow multiple borrowings per employee - remove the restriction
            // Check if there's already an active borrowing (warn but allow)
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM borrowers WHERE emp_id = ? AND status = 'active'");
            $stmt->execute([$empId]);
            $activeCount = $stmt->fetchColumn();
            
            // Insert borrower with or without application number
            if (!empty($applicationNo)) {
                $stmt = $pdo->prepare("INSERT INTO borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date, application_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                if ($stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $disbursedDate, $applicationNo])) {
                    $successCount++;
                } else {
                    $errors[] = "Row " . ($index + 1) . ": Failed to insert borrower '$empId'";
                    $errorCount++;
                }
            } else {
                // Auto-generate application number
                $stmt = $pdo->prepare("INSERT INTO borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
                if ($stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $disbursedDate])) {
                    // Get the inserted record ID and update with application number
                    $borrowerId = $pdo->lastInsertId();
                    $autoAppNo = 'APP' . str_pad($borrowerId, 6, '0', STR_PAD_LEFT);
                    $updateStmt = $pdo->prepare("UPDATE borrowers SET application_no = ? WHERE id = ?");
                    $updateStmt->execute([$autoAppNo, $borrowerId]);
                    $successCount++;
                } else {
                    $errors[] = "Row " . ($index + 1) . ": Failed to insert borrower '$empId'";
                    $errorCount++;
                }
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
        
        // Log the full error for debugging
        error_log("Import borrowers error: " . $e->getMessage());
        
        // Provide user-friendly error message
        $userMessage = 'Database error occurred during borrower import';
        $errorMessage = $e->getMessage();
        
        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            if (strpos($errorMessage, 'application_no') !== false) {
                $userMessage = 'Duplicate application number found - application numbers must be unique';
            } else {
                $userMessage = 'Duplicate entry found in borrower data';
            }
        } elseif (strpos($errorMessage, 'foreign key constraint') !== false) {
            $userMessage = 'Invalid employee reference - ensure all employee IDs exist before importing borrowers';
        } elseif (strpos($errorMessage, 'Incorrect decimal') !== false) {
            $userMessage = 'Invalid amount format - please check amount, EMI values are numeric';
        } elseif (strpos($errorMessage, 'Incorrect date') !== false) {
            $userMessage = 'Invalid date format - please check disbursed date format (YYYY-MM-DD)';
        }
        
        sendJsonResponse(false, $userMessage, [
            'errorType' => 'database',
            'errorCode' => $e->getCode(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
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
    $borrowerUpdateCount = 0;
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
            $applicationNo = isset($voucher['applicationNo']) ? trim($voucher['applicationNo']) : '';
            
            // Check if employee exists
            $stmt = $pdo->prepare("SELECT id FROM employees WHERE id = ?");
            $stmt->execute([$empId]);
            if (!$stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' not found";
                $errorCount++;
                continue;
            }
            
            // If application number is provided, validate and prepare for borrower update
            $borrowerUpdate = null;
            if (!empty($applicationNo)) {
                // Check if borrower record exists and is active
                $borrowerStmt = $pdo->prepare("SELECT id, amount, outstanding_amount FROM borrowers WHERE application_no = ? AND status = 'active'");
                $borrowerStmt->execute([$applicationNo]);
                $borrower = $borrowerStmt->fetch();
                
                if ($borrower) {
                    $newOutstanding = $borrower['outstanding_amount'] - $amount;
                    // Ensure outstanding amount doesn't go below 0
                    $newOutstanding = max(0, $newOutstanding);
                    
                    $borrowerUpdate = [
                        'id' => $borrower['id'],
                        'oldOutstanding' => $borrower['outstanding_amount'],
                        'newOutstanding' => $newOutstanding,
                        'applicationNo' => $applicationNo
                    ];
                } else {
                    // Warning but don't fail - application number might be invalid or borrower completed
                    $errors[] = "Row " . ($index + 1) . ": Warning - Application number '$applicationNo' not found or borrower not active";
                }
            }
            
            // Insert voucher with application number
            $stmt = $pdo->prepare("INSERT INTO vouchers (id, emp_id, emp_name, voucher_date, amount, month, application_no) VALUES (?, ?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$id, $empId, $empName, $date, $amount, $month, $applicationNo])) {
                $successCount++;
                
                // Update borrower outstanding amount if application number was provided and found
                if ($borrowerUpdate) {
                    $updateStmt = $pdo->prepare("UPDATE borrowers SET outstanding_amount = ? WHERE id = ?");
                    if ($updateStmt->execute([$borrowerUpdate['newOutstanding'], $borrowerUpdate['id']])) {
                        $borrowerUpdateCount++;
                        // Check if borrower should be marked as completed
                        if ($borrowerUpdate['newOutstanding'] == 0) {
                            $statusStmt = $pdo->prepare("UPDATE borrowers SET status = 'completed' WHERE id = ?");
                            $statusStmt->execute([$borrowerUpdate['id']]);
                        }
                    }
                }
            } else {
                $errors[] = "Row " . ($index + 1) . ": Failed to insert voucher '$id'";
                $errorCount++;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $message = "Import completed: $successCount vouchers imported";
        if ($borrowerUpdateCount > 0) {
            $message .= ", $borrowerUpdateCount borrower amounts updated";
        }
        if ($errorCount > 0) {
            $message .= ", $errorCount errors occurred";
        }
        
        sendJsonResponse(true, $message, [
            'successCount' => $successCount,
            'borrowerUpdateCount' => $borrowerUpdateCount,
            'errorCount' => $errorCount,
            'errors' => $errors
        ]);
        
    } catch(PDOException $e) {
        // Rollback transaction on error
        $pdo->rollback();
        
        // Log the full error for debugging
        error_log("Import vouchers error: " . $e->getMessage());
        
        // Provide user-friendly error message based on error type
        $userMessage = 'Database error occurred during import';
        $errorCode = $e->getCode();
        $errorMessage = $e->getMessage();
        
        // Handle specific database errors
        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            $userMessage = 'Duplicate entry found - some voucher data already exists';
        } elseif (strpos($errorMessage, 'foreign key constraint') !== false || strpos($errorMessage, 'Cannot add or update') !== false) {
            $userMessage = 'Invalid employee reference - please ensure all employees exist';
        } elseif (strpos($errorMessage, 'Data too long') !== false) {
            $userMessage = 'Some data values are too long for database fields';
        } elseif (strpos($errorMessage, 'Incorrect date') !== false || strpos($errorMessage, 'Invalid date') !== false) {
            $userMessage = 'Invalid date format detected in import data';
        } elseif (strpos($errorMessage, 'Incorrect decimal') !== false) {
            $userMessage = 'Invalid amount format detected in import data';
        } elseif (strpos($errorMessage, 'server has gone away') !== false) {
            $userMessage = 'Database connection lost - please try importing smaller batches';
        } elseif (strpos($errorMessage, 'Lock wait timeout') !== false) {
            $userMessage = 'Database is busy - please try again in a moment';
        }
        
        sendJsonResponse(false, $userMessage, [
            'errorType' => 'database',
            'errorCode' => $errorCode,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

// Function to update user email
function updateUserEmail() {
    // Try to get data from both JSON and POST
    $data = getPostData();
    if (empty($data)) {
        $data = $_POST;
    }
    
    $newEmail = trim($data['email'] ?? '');
    
    // Debug logging
    error_log("Email update request - User ID: " . ($_SESSION['user_id'] ?? 'not set') . ", New Email: " . $newEmail);
    error_log("Raw POST data: " . print_r($_POST, true));
    error_log("JSON data: " . print_r($data, true));
    
    // Validate input
    if (empty($newEmail)) {
        sendJsonResponse(false, 'Email is required');
        return;
    }
    
    if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(false, 'Invalid email format');
        return;
    }
    
    $pdo = getDB();
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection failed');
        return;
    }
    
    try {
        // Debug: Check current email before update
        $currentStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
        $currentStmt->execute([$_SESSION['user_id']]);
        $currentUser = $currentStmt->fetch();
        error_log("Current email in DB: " . ($currentUser['email'] ?? 'not found'));
        
        // Check if email already exists
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $checkStmt->execute([$newEmail, $_SESSION['user_id']]);
        
        if ($checkStmt->fetch()) {
            sendJsonResponse(false, 'Email address already exists');
            return;
        }
        
        // Update email
        $updateStmt = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
        $result = $updateStmt->execute([$newEmail, $_SESSION['user_id']]);
        
        // Debug: Check if update was successful
        error_log("Update result: " . ($result ? 'true' : 'false'));
        error_log("Rows affected: " . $updateStmt->rowCount());
        
        if ($result && $updateStmt->rowCount() > 0) {
            // Verify the update in database
            $verifyStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
            $verifyStmt->execute([$_SESSION['user_id']]);
            $updatedUser = $verifyStmt->fetch();
            error_log("Email after update in DB: " . ($updatedUser['email'] ?? 'not found'));
            
            // Update session
            $_SESSION['user_email'] = $newEmail;
            error_log("Email updated successfully for user ID: " . $_SESSION['user_id']);
            sendJsonResponse(true, 'Email updated successfully', ['email' => $newEmail]);
        } else {
            error_log("Failed to execute email update query or no rows affected");
            sendJsonResponse(false, 'Failed to update email - no changes made');
        }
        
    } catch (Exception $e) {
        error_log("Email update error: " . $e->getMessage());
        sendJsonResponse(false, 'An error occurred while updating email');
    }
}

// Function to change user password
function changeUserPassword() {
    $data = getPostData();
    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';
    $confirmPassword = $data['confirm_password'] ?? '';
    
    // Debug logging
    error_log("Password change request - User ID: " . ($_SESSION['user_id'] ?? 'not set'));
    
    // Validate input
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        sendJsonResponse(false, 'All password fields are required');
        return;
    }
    
    if ($newPassword !== $confirmPassword) {
        sendJsonResponse(false, 'New passwords do not match');
        return;
    }
    
    if (strlen($newPassword) < 6) {
        sendJsonResponse(false, 'New password must be at least 6 characters long');
        return;
    }
    
    $pdo = getDB();
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection failed');
        return;
    }
    
    try {
        // Get current password hash
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendJsonResponse(false, 'User not found');
            return;
        }
        
        // Verify current password
        if (!password_verify($currentPassword, $user['password'])) {
            sendJsonResponse(false, 'Current password is incorrect');
            return;
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update password
        $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        
        if ($updateStmt->execute([$hashedPassword, $_SESSION['user_id']])) {
            error_log("Password updated successfully for user ID: " . $_SESSION['user_id']);
            sendJsonResponse(true, 'Password changed successfully');
        } else {
            error_log("Failed to execute password update query");
            sendJsonResponse(false, 'Failed to update password');
        }
        
    } catch (Exception $e) {
        error_log("Password change error: " . $e->getMessage());
        sendJsonResponse(false, 'An error occurred while changing password');
    }
}

// Helper function to get POST data from JSON
function getPostData() {
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        return [];
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg());
        return [];
    }
    
    return $data ?: [];
}
?>
