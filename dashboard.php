<?php
require_once 'auth.php';

// Require login to access dashboard
requireLogin();

// Get current user data
$currentUser = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Advance Portal</title>
    <link rel="stylesheet" href="dashboard.css?v=<?php echo time(); ?>">
    <!-- SheetJS library for Excel file handling -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <!-- External JavaScript file -->
    <script src="dashboard.js?v=<?php echo time(); ?>"></script>
    <!-- Pass user data to JavaScript -->
    <script>
        window.currentUser = <?php echo json_encode($currentUser); ?>;
    </script>
</head>
<body>
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo-section">
                <img src="tecumseh.png" alt="Tecumseh Logo" class="nav-logo">
                <h2>Advance Portal</h2>
            </div>
            <div class="nav-actions">
                <span class="user-welcome">Welcome, <?php echo htmlspecialchars($currentUser['name']); ?></span>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>

    <div class="sidebar-overlay" onclick="toggleMobileMenu()"></div>

    <div class="dashboard-container">
        <aside class="sidebar">
            <ul class="sidebar-menu">
                <li class="menu-item active">
                    <a href="#dashboard">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                        Dashboard
                    </a>
                </li>
                <li class="menu-item">
                    <a href="#employees">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.01 3.01 0 0 0 17.08 7H16.92c-1.34 0-2.54.88-2.88 2.19L11.5 16H14v6h6zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5C9 8.67 8.33 8 7.5 8S6 8.67 6 9.5V15H7.5v7h0z"/>
                        </svg>
                        Employees
                    </a>
                </li>
                <li class="menu-item">
                    <a href="#borrowers">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Borrowers
                    </a>
                </li>
                <li class="menu-item">
                    <a href="#vouchers">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
                        </svg>
                        Vouchers
                    </a>
                </li>
                <li class="menu-item">
                    <a href="#reports">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        Reports
                    </a>
                </li>
            </ul>
        </aside>

        <main class="main-content">
            <!-- Dashboard Section -->
            <div class="content-section" id="dashboard-content">
                <div class="page-header">
                    <div class="header-content">
                        <h1>Dashboard</h1>
                        <p>Overview of advance payment system and key metrics</p>
                    </div>
                </div>

                <div class="table-container">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" fill="#6d87ea" viewBox="0 0 24 24">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.01 3.01 0 0 0 17.08 7H16.92c-1.34 0-2.54.88-2.88 2.19L11.5 16H14v6h6z"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3 id="total-employees">3</h3>
                                <p>Total Employees</p>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" fill="#28a745" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3 id="active-borrowers">0</h3>
                                <p>Active Borrowers</p>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" fill="#ffc107" viewBox="0 0 24 24">
                                    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3 id="active-vouchers">0</h3>
                                <p>Active Vouchers</p>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg width="24" height="24" fill="#dc3545" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <h3 id="outstanding-amount">₹0</h3>
                                <p>Outstanding Amount</p>
                            </div>
                        </div>
                    </div>

                    <table class="requests-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Application No</th>
                                <th>Employee</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">No recent activity found. Start by adding employees, borrowers, or vouchers.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Employees Section -->
            <div class="content-section" id="employees-content" style="display: none;">
                <div class="page-header">
                    <div class="header-content">
                        <h1>Employees</h1>
                        <p>Manage employee records and advance eligibility</p>
                    </div>
                    <div class="header-actions">
                        <button class="import-btn" onclick="importData('employee')">📥 Import</button>
                        <button class="export-btn" onclick="exportData('employee')">📤 Export</button>
                        <button class="add-btn" onclick="addRecord('employee')">+ Add New Employee</button>
                    </div>
                </div>
                
                <div class="filter-bar">
                    <input type="text" placeholder="Search employees..." class="search-input">
                </div>

                <div class="table-container">
                    <table class="requests-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Employee Name</th>
                                <th>Entry Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="3" style="text-align: center; padding: 20px; color: #666;">No employees found. Click "Add New Employee" to get started.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Borrowers Section -->
            <div class="content-section" id="borrowers-content" style="display: none;">
                <div class="page-header">
                    <div class="header-content">
                        <h1>Borrowers</h1>
                        <p>Track and manage active borrowers and their advance history</p>
                    </div>
                    <div class="header-actions">
                        <button class="import-btn" onclick="importData('borrower')">📥 Import</button>
                        <button class="export-btn" onclick="exportData('borrower')">📤 Export</button>
                        <button class="add-btn" onclick="addRecord('borrower')">+ Add New Borrower</button>
                    </div>
                </div>

                <div class="filter-bar">
                    <input type="text" placeholder="Search borrowers..." class="search-input">
                </div>

                <div class="table-container">
                    <table class="requests-table">
                        <thead>
                            <tr>
                                <th>Application No</th>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Advance Amount</th>
                                <th>Outstanding Amount</th>
                                <th>EMI</th>
                                <th>Month</th>
                                <th>Disbursed Date</th>
                                <th>Entry Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="10" style="text-align: center; padding: 20px; color: #666;">No borrowers found. Click "Add New Borrower" to get started.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Vouchers Section -->
            <div class="content-section" id="vouchers-content" style="display: none;">
                <div class="page-header">
                    <div class="header-content">
                        <h1>Vouchers</h1>
                        <p>Manage payment vouchers and disbursements</p>
                    </div>
                    <div class="header-actions">
                        <button class="import-btn" onclick="importData('voucher')">📥 Import</button>
                        <button class="export-btn" onclick="exportData('voucher')">📤 Export</button>
                        <button class="add-btn" onclick="addRecord('voucher')">+ Create Voucher</button>
                    </div>
                </div>

                <div class="filter-bar">
                    <input type="text" placeholder="Search vouchers..." class="search-input">
                </div>

                <div class="table-container">
                    <table class="requests-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Employee Name</th>
                                <th>Total Vouchers</th>
                                <th>Total Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">No vouchers found. Click "Create New Voucher" to get started.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Reports Section -->
            <div class="content-section" id="reports-content" style="display: none;">
                <div class="page-header">
                    <div class="header-content">
                        <h1>Reports</h1>
                        <p>Generate comprehensive reports and analytics for advance payments</p>
                    </div>
                    <div class="header-actions">
                        <button class="export-btn" onclick="exportAllData()">📤 Export All Data</button>
                        <button class="add-btn" onclick="generateAllReports()">📊 Generate All Reports</button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="requests-table">
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Last Generated</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Advance Summary Report</td>
                                <td>Complete overview of all advance payments and outstanding amounts</td>
                                <td>Summary</td>
                                <td>Never</td>
                                <td><span class="status status-pending">Ready</span></td>
                                <td>
                                    <button class="view-btn" onclick="generateReport(0)">Generate</button>
                                    <button class="edit-btn" onclick="previewReport('summary')">Preview</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Employee Advance Report</td>
                                <td>Individual employee advance history and outstanding amounts</td>
                                <td>Detail</td>
                                <td>Never</td>
                                <td><span class="status status-pending">Ready</span></td>
                                <td>
                                    <button class="view-btn" onclick="generateReport(1)">Generate</button>
                                    <button class="edit-btn" onclick="previewReport('employee')">Preview</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Department Wise Report</td>
                                <td>Department-wise advance utilization and recovery analysis</td>
                                <td>Analytics</td>
                                <td>Never</td>
                                <td><span class="status status-pending">Ready</span></td>
                                <td>
                                    <button class="view-btn" onclick="generateReport(2)">Generate</button>
                                    <button class="edit-btn" onclick="previewReport('department')">Preview</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Outstanding Amount Report</td>
                                <td>Detailed report of all outstanding advances and recovery timeline</td>
                                <td>Detail</td>
                                <td>Never</td>
                                <td><span class="status status-pending">Ready</span></td>
                                <td>
                                    <button class="view-btn" onclick="generateReport(3)">Generate</button>
                                    <button class="edit-btn" onclick="previewReport('outstanding')">Preview</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Voucher Report</td>
                                <td>Complete voucher transaction history and audit trail</td>
                                <td>Detail</td>
                                <td>Never</td>
                                <td><span class="status status-pending">Ready</span></td>
                                <td>
                                    <button class="view-btn" onclick="generateReport(4)">Generate</button>
                                    <button class="edit-btn" onclick="previewReport('voucher')">Preview</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Failed Data Report</td>
                                <td>View failed/invalid data from import operations</td>
                                <td>Error Log</td>
                                <td>Live Data</td>
                                <td><span class="status status-warning" id="failed-data-status">No Errors</span></td>
                                <td>
                                    <button class="view-btn" onclick="viewFailedData()">View Failed Data</button>
                                    <button class="delete-btn" onclick="clearFailedData()">Clear Failed Data</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal Dialogs -->
    <!-- View Modal -->
    <div id="viewModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>View Details</h2>
                <span class="close" onclick="closeModal('viewModal')">&times;</span>
            </div>
            <div class="modal-body" id="viewModalBody">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Record</h2>
                <span class="close" onclick="closeModal('editModal')">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editForm">
                    <div id="editFormFields">
                        <!-- Form fields will be populated dynamically -->
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('editModal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Add/Create Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="addModalTitle">Add New Record</h2>
                <span class="close" onclick="closeModal('addModal')">&times;</span>
            </div>
            <div class="modal-body">
                <form id="addForm">
                    <div id="addFormFields">
                        <!-- Form fields will be populated dynamically -->
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('addModal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content delete-modal">
            <div class="modal-header">
                <h2>Confirm Delete</h2>
                <span class="close" onclick="closeModal('deleteModal')">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('deleteModal')">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Import Modal -->
    <div id="importModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Import Data</h2>
                <span class="close" onclick="closeModal('importModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="import-options">
                    <div class="import-method">
                        <h3>Upload Excel File</h3>
                        <div class="file-upload-area" id="fileUploadArea">
                            <input type="file" id="excelFileInput" accept=".xlsx,.xls" style="display: none;" onchange="handleFileSelect(event)">
                            <div class="upload-prompt">
                                <svg width="48" height="48" fill="#28a745" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                <p>Click to upload Excel file or drag and drop</p>
                                <small>Supported formats: Excel (.xlsx, .xls)</small>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('excelFileInput').click()">Choose Excel File</button>
                    </div>
                    
                    <div class="import-divider">OR</div>
                    
                    <div class="import-method">
                        <h3>Sample Excel Template</h3>
                        <p>Download a sample Excel template with the correct format for importing data.</p>
                        <button type="button" class="btn btn-primary" onclick="downloadTemplate()">Download Template</button>
                    </div>
                </div>
                
                <div class="import-preview" id="importPreview" style="display: none;">
                    <h3>Data Preview</h3>
                    <div class="preview-table-container">
                        <table id="previewTable" class="requests-table">
                            <!-- Preview data will be inserted here -->
                        </table>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('importModal')">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmImportBtn" onclick="confirmImport()" disabled>Import Data</button>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
