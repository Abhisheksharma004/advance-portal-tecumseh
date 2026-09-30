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
    
    // Trim whitespace
    $dateString = trim($dateString);
    
    // Check if date is already in YYYY-MM-DD format
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
        return $dateString;
    }
    
    // Convert from DD-MM-YYYY to YYYY-MM-DD (Excel export with dashes)
    if (preg_match('/^(\d{1,2})-(\d{1,2})-(\d{4})$/', $dateString, $matches)) {
        $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $year = $matches[3];
        return $year . '-' . $month . '-' . $day;
    }
    
    // Convert from DD/MM/YYYY to YYYY-MM-DD (Excel export with slashes)
    if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $dateString, $matches)) {
        $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $year = $matches[3];
        
        // Explicitly construct the date to avoid timezone issues
        return $year . '-' . $month . '-' . $day;
    }
    
    // Convert from MM/DD/YYYY to YYYY-MM-DD (US format - less common)
    if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $dateString, $matches)) {
        // This pattern is the same as DD/MM/YYYY, so we assume DD/MM/YYYY
        // If you need MM/DD/YYYY support, you'll need additional context
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
            
        case 'get_transaction_history':
            getTransactionHistory();
            break;
            
        case 'export_transaction_history':
            exportTransactionHistory();
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
    $stmt = $pdo->query("SELECT id, name, created_at FROM advance_employees WHERE status = 'active' ORDER BY id");
    $advance_employees = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend
    $result = [];
    foreach ($advance_employees as $emp) {
        $result[$emp['id']] = [
            'id' => $emp['id'],
            'name' => $emp['name'],
            'created_at' => $emp['created_at']
        ];
    }
    
    sendJsonResponse(true, 'advance_employees loaded successfully', $result);
}

/**
 * Get all borrowers
 */
function getBorrowers() {
    $pdo = getDB();
    // Include both active and completed advance_borrowers to show completion status
    $stmt = $pdo->query("SELECT * FROM advance_borrowers WHERE status IN ('active', 'completed') ORDER BY 
        CASE WHEN status = 'active' THEN 1 ELSE 2 END, created_at DESC");
    $advance_borrowers = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend - now using unique ID as key
    $result = [];
    foreach ($advance_borrowers as $borrower) {
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
    
    sendJsonResponse(true, 'advance_borrowers loaded successfully', $result);
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
        $stmt = $pdo->prepare("SELECT * FROM advance_employees WHERE id = ?");
        $stmt->execute([$empId]);
        $employee = $stmt->fetch();
        
        if (!$employee) {
            sendJsonResponse(false, 'Employee not found');
            return;
        }
        
        // Get all borrowing records for this employee (all statuses)
        $stmt = $pdo->prepare("SELECT * FROM advance_borrowers WHERE emp_id = ? ORDER BY created_at DESC");
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
    $stmt = $pdo->query("SELECT * FROM advance_vouchers ORDER BY created_at DESC");
    $advance_vouchers = $stmt->fetchAll();
    
    // Convert to the format expected by the frontend
    $result = [];
    foreach ($advance_vouchers as $voucher) {
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
    
    sendJsonResponse(true, 'advance_vouchers loaded successfully', $result);
}

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
    try {
        $pdo = getDB();
        
        // Get counts
        $employeeCount = $pdo->query("SELECT COUNT(*) FROM advance_employees WHERE status = 'active'")->fetchColumn();
        $borrowerCount = $pdo->query("SELECT COUNT(*) FROM advance_borrowers WHERE status = 'active'")->fetchColumn();
        $voucherCount = $pdo->query("SELECT COUNT(*) FROM advance_vouchers")->fetchColumn();
        
        // Get outstanding amount - use 'outstanding_amount' column
        $outstandingAmount = $pdo->query("SELECT COALESCE(SUM(outstanding_amount), 0) FROM advance_borrowers WHERE status = 'active'")->fetchColumn();
        
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
 * Get comprehensive transaction history
 */
function getTransactionHistory() {
    try {
        $pdo = getDB();
        
        // Get filter parameters
        $transactionType = $_GET['type'] ?? '';
        $employeeId = $_GET['employee_id'] ?? '';
        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';
        $amountMin = $_GET['amount_min'] ?? '';
        $amountMax = $_GET['amount_max'] ?? '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 1000;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        $transactions = [];
        
        // Build base query conditions
        $conditions = [];
        $params = [];
        
        if ($employeeId) {
            $conditions[] = "emp_id = ?";
            $params[] = $employeeId;
        }
        
        if ($dateFrom) {
            $conditions[] = "transaction_date >= ?";
            $params[] = convertDateToYYYYMMDD($dateFrom);
        }
        
        if ($dateTo) {
            $conditions[] = "transaction_date <= ?";
            $params[] = convertDateToYYYYMMDD($dateTo);
        }
        
        if ($amountMin) {
            $conditions[] = "amount >= ?";
            $params[] = (float)$amountMin;
        }
        
        if ($amountMax) {
            $conditions[] = "amount <= ?";
            $params[] = (float)$amountMax;
        }
        
        $whereClause = $conditions ? " WHERE " . implode(" AND ", $conditions) : "";
        
        // Get advance transactions (borrowers - money given out)
        if (!$transactionType || $transactionType === 'advance') {
            $sql = "SELECT 
                        'advance' as transaction_type,
                        emp_id,
                        name as emp_name,
                        amount,
                        disbursed_date as transaction_date,
                        application_no as reference,
                        status,
                        created_at,
                        'Advance disbursed to employee' as description
                    FROM advance_borrowers" . $whereClause . "
                    ORDER BY disbursed_date ASC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $advances = $stmt->fetchAll();
            
            foreach ($advances as $advance) {
                $transactions[] = [
                    'date' => convertDateToDDMMYYYY($advance['transaction_date']),
                    'type' => 'Loan Payment',
                    'emp_id' => $advance['emp_id'],
                    'emp_name' => $advance['emp_name'],
                    'amount' => (float)$advance['amount'],
                    'amount_formatted' => '₹' . number_format($advance['amount'], 2),
                    'description' => $advance['description'],
                    'reference' => $advance['reference'] ?: 'N/A',
                    'voucher_number' => '', // Empty for advance transactions
                    'status' => ucfirst($advance['status']),
                    'created_at' => $advance['created_at'],
                    'transaction_type' => 'advance',
                    'direction' => 'outgoing' // Money going out
                ];
            }
        }
        
        // Get repayment/voucher transactions (vouchers - money coming back)
        if (!$transactionType || $transactionType === 'repayment') {
            $sql = "SELECT 
                        'repayment' as transaction_type,
                        emp_id,
                        emp_name,
                        amount,
                        voucher_date as transaction_date,
                        COALESCE(application_no, id) as reference,
                        id as voucher_id,
                        status,
                        created_at,
                        CONCAT('Voucher payment - ', month) as description
                    FROM advance_vouchers" . $whereClause . "
                    ORDER BY voucher_date ASC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $vouchers = $stmt->fetchAll();
            
            foreach ($vouchers as $voucher) {
                $transactions[] = [
                    'date' => convertDateToDDMMYYYY($voucher['transaction_date']),
                    'type' => 'EMI Payment',
                    'emp_id' => $voucher['emp_id'],
                    'emp_name' => $voucher['emp_name'],
                    'amount' => (float)$voucher['amount'],
                    'amount_formatted' => '₹' . number_format($voucher['amount'], 2),
                    'description' => $voucher['description'],
                    'reference' => $voucher['reference'] ?: 'N/A',
                    'voucher_number' => 'V' . str_pad($voucher['voucher_id'], 6, '0', STR_PAD_LEFT), // Format: V000001
                    'status' => ucfirst($voucher['status']),
                    'created_at' => $voucher['created_at'],
                    'transaction_type' => 'repayment',
                    'direction' => 'incoming' // Money coming in
                ];
            }
        }
        
        // Sort all transactions by date (oldest first)
        usort($transactions, function($a, $b) {
            $dateA = DateTime::createFromFormat('d-m-Y', $a['date']);
            $dateB = DateTime::createFromFormat('d-m-Y', $b['date']);
            
            if ($dateA && $dateB) {
                return $dateA <=> $dateB; // Oldest first
            }
            return 0;
        });
        
        // Apply pagination
        $totalTransactions = count($transactions);
        $transactions = array_slice($transactions, $offset, $limit);
        
        // Calculate summary statistics based on filtered results
        $totalAdvances = 0;
        $totalRepayments = 0;
        $currentOutstanding = 0;
        
        // Get filtered summary from database
        // Calculate advance summary with filters
        $advanceSql = "SELECT COALESCE(SUM(amount), 0) FROM advance_borrowers" . $whereClause;
        $stmt = $pdo->prepare($advanceSql);
        $stmt->execute($params);
        $advanceSum = $stmt->fetchColumn();
        
        // Calculate repayment summary with filters - need to adjust WHERE clause for voucher date
        $repaymentWhereClause = $whereClause;
        if ($whereClause) {
            // Replace transaction_date with voucher_date for vouchers table
            $repaymentWhereClause = str_replace('transaction_date', 'voucher_date', $whereClause);
        }
        $repaymentSql = "SELECT COALESCE(SUM(amount), 0) FROM advance_vouchers" . $repaymentWhereClause;
        $stmt = $pdo->prepare($repaymentSql);
        $stmt->execute($params);
        $repaymentSum = $stmt->fetchColumn();
        
        // Calculate filtered outstanding amount for advances within the date range
        $outstandingWhereClause = $whereClause;
        if ($outstandingWhereClause) {
            // For outstanding calculation, we need to include both date filter and active status
            // Replace transaction_date with disbursed_date for borrowers table
            $outstandingWhereClause = str_replace('transaction_date', 'disbursed_date', $outstandingWhereClause);
            $outstandingWhereClause .= " AND status = 'active'";
        } else {
            $outstandingWhereClause = " WHERE status = 'active'";
        }
        $outstandingSql = "SELECT COALESCE(SUM(outstanding_amount), 0) FROM advance_borrowers" . $outstandingWhereClause;
        $stmt = $pdo->prepare($outstandingSql);
        $stmt->execute($params);
        $outstandingSum = $stmt->fetchColumn();
        
        $result = [
            'transactions' => $transactions,
            'pagination' => [
                'total' => $totalTransactions,
                'limit' => $limit,
                'offset' => $offset,
                'hasMore' => ($offset + $limit) < $totalTransactions
            ],
            'summary' => [
                'totalTransactions' => $totalTransactions,
                'totalAdvances' => (float)$advanceSum,
                'totalRepayments' => (float)$repaymentSum,
                'currentOutstanding' => (float)$outstandingSum,
                'netFlow' => (float)$repaymentSum - (float)$advanceSum
            ]
        ];
        
        sendJsonResponse(true, 'Transaction history loaded successfully', $result);
        
    } catch (Exception $e) {
        error_log("Get transaction history error: " . $e->getMessage());
        sendJsonResponse(false, 'Error loading transaction history: ' . $e->getMessage());
    }
}

/**
 * Export transaction history to Excel
 */
function exportTransactionHistory() {
    try {
        $pdo = getDB();
        
        // Get filter parameters (same as getTransactionHistory)
        $transactionType = $_GET['type'] ?? '';
        $employeeId = $_GET['employee_id'] ?? '';
        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';
        $amountMin = $_GET['amount_min'] ?? '';
        $amountMax = $_GET['amount_max'] ?? '';
        
        $transactions = [];
        
        // Build base query conditions
        $conditions = [];
        $params = [];
        
        if ($employeeId) {
            $conditions[] = "emp_id = ?";
            $params[] = $employeeId;
        }
        
        if ($dateFrom) {
            $conditions[] = "transaction_date >= ?";
            $params[] = convertDateToYYYYMMDD($dateFrom);
        }
        
        if ($dateTo) {
            $conditions[] = "transaction_date <= ?";
            $params[] = convertDateToYYYYMMDD($dateTo);
        }
        
        if ($amountMin) {
            $conditions[] = "amount >= ?";
            $params[] = (float)$amountMin;
        }
        
        if ($amountMax) {
            $conditions[] = "amount <= ?";
            $params[] = (float)$amountMax;
        }
        
        $whereClause = $conditions ? " WHERE " . implode(" AND ", $conditions) : "";
        
        // Get advance transactions
        if (!$transactionType || $transactionType === 'advance') {
            $sql = "SELECT 
                        'Advance Given' as transaction_type,
                        emp_id,
                        name as emp_name,
                        amount,
                        disbursed_date as transaction_date,
                        application_no as reference,
                        status,
                        created_at,
                        'Advance disbursed to employee' as description
                    FROM advance_borrowers" . $whereClause . "
                    ORDER BY disbursed_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $advances = $stmt->fetchAll();
            
            foreach ($advances as $advance) {
                $transactions[] = [
                    'Date' => convertDateToDDMMYYYY($advance['transaction_date']),
                    'Transaction Type' => $advance['transaction_type'],
                    'Employee ID' => $advance['emp_id'],
                    'Employee Name' => $advance['emp_name'],
                    'Amount' => (float)$advance['amount'],
                    'Description' => $advance['description'],
                    'Reference' => $advance['reference'] ?: 'N/A',
                    'Status' => ucfirst($advance['status']),
                    'Created At' => $advance['created_at']
                ];
            }
        }
        
        // Get repayment/voucher transactions
        if (!$transactionType || $transactionType === 'repayment') {
            $sql = "SELECT 
                        'Repayment/Voucher' as transaction_type,
                        emp_id,
                        emp_name,
                        amount,
                        voucher_date as transaction_date,
                        COALESCE(application_no, id) as reference,
                        status,
                        created_at,
                        CONCAT('Voucher payment - ', month) as description
                    FROM advance_vouchers" . $whereClause . "
                    ORDER BY voucher_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $vouchers = $stmt->fetchAll();
            
            foreach ($vouchers as $voucher) {
                $transactions[] = [
                    'Date' => convertDateToDDMMYYYY($voucher['transaction_date']),
                    'Transaction Type' => $voucher['transaction_type'],
                    'Employee ID' => $voucher['emp_id'],
                    'Employee Name' => $voucher['emp_name'],
                    'Amount' => (float)$voucher['amount'],
                    'Description' => $voucher['description'],
                    'Reference' => $voucher['reference'] ?: 'N/A',
                    'Status' => ucfirst($voucher['status']),
                    'Created At' => $voucher['created_at']
                ];
            }
        }
        
        // Sort by date (newest first)
        usort($transactions, function($a, $b) {
            $dateA = DateTime::createFromFormat('d-m-Y', $a['Date']);
            $dateB = DateTime::createFromFormat('d-m-Y', $b['Date']);
            
            if ($dateA && $dateB) {
                return $dateB <=> $dateA;
            }
            return 0;
        });
        
        // Clear all output buffers to prevent corruption
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        // Set headers for CSV download (fully supported by Excel)
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="Transaction_History_' . date('Y-m-d') . '.csv"');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        $output = fopen('php://output', 'w');
        // UTF-8 BOM for Microsoft Excel
        fputs($output, "\xEF\xBB\xBF");
        
        fputcsv($output, ['Date', 'Transaction Type', 'Employee ID', 'Employee Name', 'Amount', 'Description', 'Reference', 'Status', 'Created At']);
        
        foreach ($transactions as $transaction) {
            fputcsv($output, [
                $transaction['Date'],
                $transaction['Transaction Type'],
                $transaction['Employee ID'],
                $transaction['Employee Name'],
                $transaction['Amount'],
                $transaction['Description'],
                $transaction['Reference'],
                $transaction['Status'],
                $transaction['Created At']
            ]);
        }
        
        fclose($output);
        exit;
        
    } catch (Exception $e) {
        error_log("Export transaction history error: " . $e->getMessage());
        header('Content-Type: application/json');
        sendJsonResponse(false, 'Error exporting transaction history: ' . $e->getMessage());
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
        $stmt = $pdo->prepare("SELECT id FROM advance_employees WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'Employee ID already exists');
            return;
        }
        
        // Insert new employee with only ID and name
        $stmt = $pdo->prepare("INSERT INTO advance_employees (id, name) VALUES (?, ?)");
        $stmt->execute([$id, $name]);
        
        // Get the created_at timestamp
        $stmt = $pdo->prepare("SELECT created_at FROM advance_employees WHERE id = ?");
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
        $stmt = $pdo->prepare("SELECT id FROM advance_employees WHERE id = ?");
        $stmt->execute([$empId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(false, 'Employee ID not found');
            return;
        }
        
        // If application number is provided, check if it's unique
        if (!empty($applicationNo)) {
            $stmt = $pdo->prepare("SELECT id FROM advance_borrowers WHERE application_no = ?");
            $stmt->execute([$applicationNo]);
            if ($stmt->fetch()) {
                sendJsonResponse(false, 'Application number already exists');
                return;
            }
        }
        
        // Allow multiple borrowings per employee - remove the restriction
        // Check if there's already an active borrowing (warn but allow)
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM advance_borrowers WHERE emp_id = ? AND status = 'active'");
        $stmt->execute([$empId]);
        $activeCount = $stmt->fetchColumn();
        
        // Insert new borrower (outstanding_amount will be same as amount initially)
        $dateForSQL = str_replace('-', '', $disbursedDate); // Convert to YYYYMMDD format
        if (!empty($applicationNo)) {
            $stmt = $pdo->prepare("INSERT INTO advance_borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date, application_no) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS DATE), ?)");
            $stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $dateForSQL, $applicationNo]);
        } else {
            // Auto-generate application number based on borrower ID
            $stmt = $pdo->prepare("INSERT INTO advance_borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS DATE))");
            $stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $dateForSQL]);
            
            // Get the inserted record ID and update with application number
            $borrowerId = $pdo->lastInsertId();
            $autoAppNo = 'APP' . str_pad($borrowerId, 6, '0', STR_PAD_LEFT);
            $stmt = $pdo->prepare("UPDATE advance_borrowers SET application_no = ? WHERE id = ?");
            $stmt->execute([$autoAppNo, $borrowerId]);
        }
        
        // Get the created borrower details
        $stmt = $pdo->prepare("SELECT * FROM advance_borrowers WHERE id = ?");
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
        $stmt = $pdo->prepare("SELECT id FROM advance_employees WHERE id = ?");
        $stmt->execute([$empId]);
        if (!$stmt->fetch()) {
            $pdo->rollBack();
            sendJsonResponse(false, "Employee ID '$empId' not found. Please verify the employee ID.");
            return;
        }
        
        // Insert new voucher with application number using direct date insertion
        // This ensures the exact date from input is stored without any increment/decrement
        $stmt = $pdo->prepare("INSERT INTO advance_vouchers (id, emp_id, emp_name, voucher_date, amount, month, application_no) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $empId, $empName, $date, $amount, $month, $applicationNo]);
        
        // Get the auto-generated ID
        $autoId = $pdo->lastInsertId();
        
        $borrowerUpdate = null;
        
        if (!empty($applicationNo)) {
            // Find the specific borrower record by application number
            $borrowerStmt = $pdo->prepare("SELECT id, amount, outstanding_amount FROM advance_borrowers WHERE application_no = ? AND status = 'active'");
            $borrowerStmt->execute([$applicationNo]);
            $borrower = $borrowerStmt->fetch();
            
            if ($borrower) {
                $borrowerId = $borrower['id'];
                $originalAmount = floatval($borrower['amount']);
                $currentOutstanding = floatval($borrower['outstanding_amount']);
                $newOutstanding = $currentOutstanding - $amount;
                
                if ($newOutstanding <= 0) {
                    // Mark this specific borrower record as completed
                    $updateStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = 0, status = 'completed' WHERE id = ?");
                    $updateStmt->execute([$borrowerId]);
                    $borrowerUpdate = ['status' => 'completed', 'originalAmount' => $originalAmount, 'newOutstanding' => 0, 'reducedBy' => $amount, 'applicationNo' => $applicationNo];
                } else {
                    // Reduce only the outstanding amount for this specific borrower
                    $updateStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = ? WHERE id = ?");
                    $updateStmt->execute([$newOutstanding, $borrowerId]);
                    $borrowerUpdate = ['status' => 'active', 'originalAmount' => $originalAmount, 'newOutstanding' => $newOutstanding, 'reducedBy' => $amount, 'applicationNo' => $applicationNo];
                }
            }
        } else {
            // Fallback: Check if employee has any active borrower record (for backward compatibility)
            $borrowerStmt = $pdo->prepare("SELECT TOP 1 id, amount, outstanding_amount FROM advance_borrowers WHERE emp_id = ? AND status = 'active' ORDER BY created_at ASC");
            $borrowerStmt->execute([$empId]);
            $borrower = $borrowerStmt->fetch();
            
            if ($borrower) {
                $borrowerId = $borrower['id'];
                $originalAmount = floatval($borrower['amount']);
                $currentOutstanding = floatval($borrower['outstanding_amount']);
                $newOutstanding = $currentOutstanding - $amount;
                
                if ($newOutstanding <= 0) {
                    // Mark borrower as completed
                    $updateStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = 0, status = 'completed' WHERE id = ?");
                    $updateStmt->execute([$borrowerId]);
                    $borrowerUpdate = ['status' => 'completed', 'originalAmount' => $originalAmount, 'newOutstanding' => 0, 'reducedBy' => $amount];
                } else {
                    // Reduce only the outstanding amount
                    $updateStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = ? WHERE id = ?");
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
        $stmt = $pdo->prepare("UPDATE advance_employees SET name = ? WHERE id = ?");
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
        $stmt = $pdo->prepare("SELECT amount, outstanding_amount FROM advance_borrowers WHERE id = ? AND status = 'active'");
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
        $stmt = $pdo->prepare("UPDATE advance_borrowers SET emp_id = ?, name = ?, amount = ?, outstanding_amount = ?, emi = ?, months = ?, disbursed_date = ? WHERE id = ? AND status = 'active'");
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
        $stmt = $pdo->prepare("UPDATE advance_vouchers SET id = ?, emp_id = ?, emp_name = ?, voucher_date = ?, amount = ?, month = ? WHERE auto_id = ?");
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
        $stmt = $pdo->prepare("UPDATE advance_employees SET status = 'inactive' WHERE id = ?");
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
        $stmt = $pdo->prepare("UPDATE advance_borrowers SET status = 'cancelled' WHERE id = ? AND status = 'active'");
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
    
    $autoId = !empty($_POST['auto_id']) ? intval($_POST['auto_id']) : null;
    $id = !empty($_POST['id']) ? trim($_POST['id']) : null;
    
    if (empty($autoId) && empty($id)) {
        sendJsonResponse(false, 'Voucher ID is required');
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Fetch voucher details before deleting
        if ($autoId) {
            $stmt = $pdo->prepare("SELECT * FROM advance_vouchers WHERE auto_id = ?");
            $stmt->execute([$autoId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM advance_vouchers WHERE id = ?");
            $stmt->execute([$id]);
        }
        $voucher = $stmt->fetch();
        
        if (!$voucher) {
            $pdo->rollBack();
            sendJsonResponse(false, 'Voucher not found');
            return;
        }
        
        $voucherAmount = floatval($voucher['amount']);
        $applicationNo = !empty($voucher['application_no']) ? trim($voucher['application_no']) : null;
        $empId = !empty($voucher['emp_id']) ? trim($voucher['emp_id']) : null;
        $actualAutoId = $voucher['auto_id'];
        
        // Delete the voucher
        $delStmt = $pdo->prepare("DELETE FROM advance_vouchers WHERE auto_id = ?");
        $delStmt->execute([$actualAutoId]);
        
        $borrowerUpdated = false;
        $newOutstanding = null;
        $newStatus = null;
        
        // Update borrower's outstanding amount and status
        if (!empty($applicationNo)) {
            // Find borrower by application number
            $bStmt = $pdo->prepare("SELECT id, amount, outstanding_amount, status FROM advance_borrowers WHERE application_no = ?");
            $bStmt->execute([$applicationNo]);
            $borrower = $bStmt->fetch();
            
            if ($borrower) {
                // Calculate remaining total paid vouchers for this borrower after deletion
                $paidStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM advance_vouchers WHERE application_no = ?");
                $paidStmt->execute([$applicationNo]);
                $totalPaid = floatval($paidStmt->fetchColumn());
                
                $borrowerAmount = floatval($borrower['amount']);
                $newOutstanding = max(0, $borrowerAmount - $totalPaid);
                $newStatus = ($newOutstanding <= 0) ? 'completed' : 'active';
                
                $upStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = ?, status = ? WHERE id = ?");
                $upStmt->execute([$newOutstanding, $newStatus, $borrower['id']]);
                $borrowerUpdated = true;
            }
        }
        
        // Fallback: If not matched by application_no, look up by employee ID
        if (!$borrowerUpdated && !empty($empId)) {
            $bStmt = $pdo->prepare("SELECT TOP 1 id, amount, outstanding_amount, status FROM advance_borrowers WHERE emp_id = ? ORDER BY created_at DESC");
            $bStmt->execute([$empId]);
            $borrower = $bStmt->fetch();
            
            if ($borrower) {
                $borrowerAmount = floatval($borrower['amount']);
                $currentOutstanding = floatval($borrower['outstanding_amount']);
                $newOutstanding = min($borrowerAmount, $currentOutstanding + $voucherAmount);
                $newStatus = ($newOutstanding <= 0) ? 'completed' : 'active';
                
                $upStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = ?, status = ? WHERE id = ?");
                $upStmt->execute([$newOutstanding, $newStatus, $borrower['id']]);
                $borrowerUpdated = true;
            }
        }
        
        $pdo->commit();
        
        sendJsonResponse(true, 'Voucher deleted successfully and outstanding amount updated', [
            'borrower_updated' => $borrowerUpdated,
            'new_outstanding' => $newOutstanding,
            'new_status' => $newStatus
        ]);
    } catch(PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
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
 * Import multiple advance_employees from Excel data
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
    
    $advance_employees = $data['employees'];
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        foreach ($advance_employees as $index => $employee) {
            // Validate required fields
            if (empty($employee['id']) || empty($employee['name'])) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID and Name are required";
                $errorCount++;
                continue;
            }
            
            $id = trim($employee['id']);
            $name = trim($employee['name']);
            
            // Check if employee ID already exists
            $stmt = $pdo->prepare("SELECT id FROM advance_employees WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$id' already exists";
                $errorCount++;
                continue;
            }
            
            // Insert employee
            $stmt = $pdo->prepare("INSERT INTO advance_employees (id, name) VALUES (?, ?)");
            if ($stmt->execute([$id, $name])) {
                $successCount++;
            } else {
                $errors[] = "Row " . ($index + 1) . ": Failed to insert employee '$id'";
                $errorCount++;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $message = "Import completed: $successCount advance_employees imported";
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
        error_log("Import advance_employees error: " . $e->getMessage());
        
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
 * Import multiple advance_borrowers from Excel data
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
    
    $advance_borrowers = $data['borrowers'];
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        foreach ($advance_borrowers as $index => $borrower) {
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
            $stmt = $pdo->prepare("SELECT id FROM advance_employees WHERE id = ?");
            $stmt->execute([$empId]);
            if (!$stmt->fetch()) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' not found";
                $errorCount++;
                continue;
            }
            
            // If application number is provided, check if it's unique
            if (!empty($applicationNo)) {
                $stmt = $pdo->prepare("SELECT id FROM advance_borrowers WHERE application_no = ?");
                $stmt->execute([$applicationNo]);
                if ($stmt->fetch()) {
                    $errors[] = "Row " . ($index + 1) . ": Application number '$applicationNo' already exists";
                    $errorCount++;
                    continue;
                }
            }
            
            // Allow multiple borrowings per employee - remove the restriction
            // Check if there's already an active borrowing (warn but allow)
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM advance_borrowers WHERE emp_id = ? AND status = 'active'");
            $stmt->execute([$empId]);
            $activeCount = $stmt->fetchColumn();
            
            // Insert borrower with or without application number
            $dateForSQL = str_replace('-', '', $disbursedDate); // Convert to YYYYMMDD format
            if (!empty($applicationNo)) {
                $stmt = $pdo->prepare("INSERT INTO advance_borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date, application_no) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS DATE), ?)");
                if ($stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $dateForSQL, $applicationNo])) {
                    $successCount++;
                } else {
                    $errors[] = "Row " . ($index + 1) . ": Failed to insert borrower '$empId'";
                    $errorCount++;
                }
            } else {
                // Auto-generate application number
                $stmt = $pdo->prepare("INSERT INTO advance_borrowers (emp_id, name, amount, outstanding_amount, emi, months, disbursed_date) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS DATE))");
                if ($stmt->execute([$empId, $name, $amount, $amount, $emi, $months, $dateForSQL])) {
                    // Get the inserted record ID and update with application number
                    $borrowerId = $pdo->lastInsertId();
                    $autoAppNo = 'APP' . str_pad($borrowerId, 6, '0', STR_PAD_LEFT);
                    $updateStmt = $pdo->prepare("UPDATE advance_borrowers SET application_no = ? WHERE id = ?");
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
        
        $message = "Import completed: $successCount advance_borrowers imported";
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
        error_log("Import advance_borrowers error: " . $e->getMessage());
        
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
 * Import multiple advance_vouchers from Excel data
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
    
    $advance_vouchers = $data['vouchers'];
    $successCount = 0;
    $errorCount = 0;
    $borrowerUpdateCount = 0;
    $errors = [];

    try {
        // Start transaction
        $pdo->beginTransaction();
        
        foreach ($advance_vouchers as $index => $voucher) {
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
            
            // Additional validation
            if (empty($applicationNo)) {
                $applicationNo = null; // Set to NULL for database
            }
            
            // Validate voucher ID length and format
            if (strlen($id) > 20) {
                $errors[] = "Row " . ($index + 1) . ": Voucher ID '$id' is too long (max 20 characters)";
                $errorCount++;
                continue;
            }
            
            // Validate employee ID length
            if (strlen($empId) > 20) {
                $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' is too long (max 20 characters)";
                $errorCount++;
                continue;
            }
            
            // Validate amount
            if ($amount <= 0) {
                $errors[] = "Row " . ($index + 1) . ": Amount must be greater than 0";
                $errorCount++;
                continue;
            }
            
            // Validate date format
            if (!$date || $date == $voucher['date']) {
                $errors[] = "Row " . ($index + 1) . ": Invalid date format. Please use DD-MM-YYYY format";
                $errorCount++;
                continue;
            }
            
            // Check if employee exists
            $stmt = $pdo->prepare("SELECT id FROM advance_employees WHERE id = ?");
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
                $borrowerStmt = $pdo->prepare("SELECT id, amount, outstanding_amount FROM advance_borrowers WHERE application_no = ? AND status = 'active'");
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
            
            // Insert voucher with proper NULL handling for application number
            try {
                // Use direct date string insertion to avoid any timezone/conversion issues
                // This ensures the exact date from Excel is stored without increment/decrement
                $stmt = $pdo->prepare("INSERT INTO advance_vouchers (id, emp_id, emp_name, voucher_date, amount, month, application_no) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $applicationNoValue = $applicationNo === '' ? null : $applicationNo;
                $result = $stmt->execute([$id, $empId, $empName, $date, $amount, $month, $applicationNoValue]);
                
                if ($result) {
                    $successCount++;
                    
                    // Update borrower outstanding amount if application number was provided and found
                    if ($borrowerUpdate) {
                        $updateStmt = $pdo->prepare("UPDATE advance_borrowers SET outstanding_amount = ? WHERE id = ?");
                        if ($updateStmt->execute([$borrowerUpdate['newOutstanding'], $borrowerUpdate['id']])) {
                            $borrowerUpdateCount++;
                            // Check if borrower should be marked as completed
                            if ($borrowerUpdate['newOutstanding'] == 0) {
                                $statusStmt = $pdo->prepare("UPDATE advance_borrowers SET status = 'completed' WHERE id = ?");
                                $statusStmt->execute([$borrowerUpdate['id']]);
                            }
                        }
                    }
                } else {
                    $errorInfo = $stmt->errorInfo();
                    $errors[] = "Row " . ($index + 1) . ": Failed to insert voucher '$id' - " . $errorInfo[2];
                    $errorCount++;
                }
            } catch (PDOException $insertException) {
                // Handle database errors during insert (excluding duplicate-related errors)
                $errorMessage = $insertException->getMessage();
                $errorCode = $insertException->getCode();
                
                if ($errorCode == 23000) {
                    if (strpos($errorMessage, 'FK_vouchers_emp_id') !== false) {
                        $errors[] = "Row " . ($index + 1) . ": Employee ID '$empId' does not exist";
                    } elseif (strpos($errorMessage, 'FK_vouchers_application_no') !== false) {
                        $errors[] = "Row " . ($index + 1) . ": Application number '$applicationNo' does not exist";
                    } else {
                        $errors[] = "Row " . ($index + 1) . ": Database constraint violation for voucher '$id' - " . $errorMessage;
                    }
                } else {
                    $errors[] = "Row " . ($index + 1) . ": Database error inserting voucher '$id' - " . $errorMessage;
                }
                $errorCount++;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        $message = "Import completed: $successCount advance_vouchers imported";
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
        error_log("Import advance_vouchers error: " . $e->getMessage());
        
        // Provide user-friendly error message based on error type
        $userMessage = 'Database error occurred during import';
        $errorCode = $e->getCode();
        $errorMessage = $e->getMessage();
        
        // Handle specific database errors
        if (strpos($errorMessage, 'foreign key constraint') !== false || strpos($errorMessage, 'FOREIGN KEY constraint') !== false || strpos($errorMessage, 'Cannot add or update') !== false) {
            $userMessage = 'Invalid employee reference - please ensure all employee IDs exist in the system';
        } elseif (strpos($errorMessage, 'CHECK constraint') !== false) {
            $userMessage = 'Invalid data values - please check status fields and data formats';
        } elseif (strpos($errorMessage, 'Data too long') !== false || strpos($errorMessage, 'String or binary data would be truncated') !== false) {
            $userMessage = 'Some data values are too long for database fields';
        } elseif (strpos($errorMessage, 'Incorrect date') !== false || strpos($errorMessage, 'Invalid date') !== false || strpos($errorMessage, 'Conversion failed') !== false) {
            $userMessage = 'Invalid date format detected in import data - please use DD-MM-YYYY format';
        } elseif (strpos($errorMessage, 'Incorrect decimal') !== false || strpos($errorMessage, 'Invalid column type') !== false) {
            $userMessage = 'Invalid amount format detected - please ensure amounts are valid numbers';
        } elseif (strpos($errorMessage, 'server has gone away') !== false) {
            $userMessage = 'Database connection lost - please try importing smaller batches';
        } elseif (strpos($errorMessage, 'Lock wait timeout') !== false || strpos($errorMessage, 'timeout') !== false) {
            $userMessage = 'Database is busy - please try again in a moment';
        } elseif ($errorCode == 23000) {
            // SQL Server constraint violation error (excluding duplicates as they are now allowed)
            if (strpos($errorMessage, 'FK_vouchers_emp_id') !== false) {
                $userMessage = 'Invalid employee ID - employee does not exist in the system';
            } elseif (strpos($errorMessage, 'FK_vouchers_application_no') !== false) {
                $userMessage = 'Invalid application number - borrower record does not exist';
            } else {
                $userMessage = 'Data constraint violation - please check your import data for invalid references';
            }
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
        $currentStmt = $pdo->prepare("SELECT email FROM advance_users WHERE id = ?");
        $currentStmt->execute([$_SESSION['user_id']]);
        $currentUser = $currentStmt->fetch();
        error_log("Current email in DB: " . ($currentUser['email'] ?? 'not found'));
        
        // Check if email already exists
        $checkStmt = $pdo->prepare("SELECT id FROM advance_users WHERE email = ? AND id != ?");
        $checkStmt->execute([$newEmail, $_SESSION['user_id']]);
        
        if ($checkStmt->fetch()) {
            sendJsonResponse(false, 'Email address already exists');
            return;
        }
        
        // Update email
        $updateStmt = $pdo->prepare("UPDATE advance_users SET email = ? WHERE id = ?");
        $result = $updateStmt->execute([$newEmail, $_SESSION['user_id']]);
        
        // Debug: Check if update was successful
        error_log("Update result: " . ($result ? 'true' : 'false'));
        error_log("Rows affected: " . $updateStmt->rowCount());
        
        if ($result && $updateStmt->rowCount() > 0) {
            // Verify the update in database
            $verifyStmt = $pdo->prepare("SELECT email FROM advance_users WHERE id = ?");
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
        $stmt = $pdo->prepare("SELECT password FROM advance_users WHERE id = ?");
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
        $updateStmt = $pdo->prepare("UPDATE advance_users SET password = ? WHERE id = ?");
        
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
