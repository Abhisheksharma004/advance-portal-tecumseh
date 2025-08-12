// Advance Payment Dashboard JavaScript
// Main application logic for managing employees, borrowers, and vouchers

// ========================================
// Global Variables & Data Storage
// ========================================
const data = {
    employees: {},
    borrowers: {},
    vouchers: {}
};

// Failed data storage for import errors
const failedData = {
    employees: [],
    borrowers: [],
    vouchers: [],
    lastUpdated: null
};

let currentDeleteId = null;
let currentDeleteType = null;
let currentImportType = null;
let importPreviewData = null;

// ========================================
// Utility Functions
// ========================================

/**
 * Convert date from YYYY-MM-DD to DD-MM-YYYY format
 * @param {string|Date|number} dateString - Date in various formats
 * @returns {string} - Date in DD-MM-YYYY format
 */
function convertDateFormat(dateString) {
    if (!dateString) return dateString;
    
    // Handle Date objects
    if (dateString instanceof Date) {
        const day = String(dateString.getDate()).padStart(2, '0');
        const month = String(dateString.getMonth() + 1).padStart(2, '0');
        const year = dateString.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    // Handle Excel numeric dates (days since 1900-01-01)
    if (typeof dateString === 'number') {
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (dateString - 1) * 24 * 60 * 60 * 1000);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    // Convert to string if not already
    const dateStr = String(dateString);
    
    // Check if date is already in DD-MM-YYYY format
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        return dateStr;
    }
    
    // Convert from YYYY-MM-DD to DD-MM-YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    }
    
    // Try to parse as Date and format
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        }
    } catch (e) {
        console.warn('Could not parse date:', dateStr);
    }
    
    return dateStr;
}

/**
 * Convert date format from DD-MM-YYYY to YYYY-MM-DD for HTML date inputs
 * @param {string} dateString - Date in DD-MM-YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
function convertDateToHTMLFormat(dateString) {
    if (!dateString) return '';
    
    // Convert to string if not already
    const dateStr = String(dateString);
    
    // Check if date is already in YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
    }
    
    // Convert from DD-MM-YYYY to YYYY-MM-DD
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
    }
    
    // Try to parse as Date and format to YYYY-MM-DD
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.error('Error parsing date:', dateStr, e);
    }
    
    return '';
}

// ========================================
// Data Loading Functions
// ========================================

/**
 * Load data from database via API
 */
async function loadDataFromAPI(type) {
    try {
        // Map the correct API action names
        const actionMap = {
            'employee': 'get_employees',
            'employees': 'get_employees',
            'borrower': 'get_borrowers',
            'borrowers': 'get_borrowers', 
            'voucher': 'get_vouchers',
            'vouchers': 'get_vouchers'
        };
        
        const action = actionMap[type] || `get${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        const response = await fetch(`api.php?action=${action}`, {
            credentials: 'same-origin'
        });
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the response text first to check if it's valid JSON
        const responseText = await response.text();
        
        // Check if response looks like JSON
        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
            console.error('Invalid JSON response:', responseText);
            showNotification(`Error loading ${type}: Server returned invalid response`, 'error');
            return false;
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success) {
            data[type] = result.data;
            return true;
        } else {
            console.error(`Error loading ${type}:`, result.message);
            showNotification(`Error loading ${type}: ${result.message}`, 'error');
            return false;
        }
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        if (error instanceof SyntaxError) {
            showNotification(`Error loading ${type}: Server returned invalid JSON`, 'error');
        } else {
            showNotification(`Error loading ${type}: ${error.message}`, 'error');
        }
        return false;
    }
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const response = await fetch('api.php?action=get_dashboard_stats', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
            console.error('Invalid JSON response for dashboard stats:', responseText);
            // Set error state for all stats
            const totalEmployeesEl = document.getElementById('total-employees');
            const activeBorrowersEl = document.getElementById('active-borrowers');
            const activeVouchersEl = document.getElementById('active-vouchers');
            const outstandingAmountEl = document.getElementById('outstanding-amount');
            
            if (totalEmployeesEl) totalEmployeesEl.textContent = 'Error';
            if (activeBorrowersEl) activeBorrowersEl.textContent = 'Error';
            if (activeVouchersEl) activeVouchersEl.textContent = 'Error';
            if (outstandingAmountEl) outstandingAmountEl.textContent = 'Error';
            return;
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success) {
            const stats = result.data;
            
            // Update stat cards with correct IDs
            const totalEmployeesEl = document.getElementById('total-employees');
            const activeBorrowersEl = document.getElementById('active-borrowers');
            const activeVouchersEl = document.getElementById('active-vouchers');
            const outstandingAmountEl = document.getElementById('outstanding-amount');
            
            if (totalEmployeesEl) totalEmployeesEl.textContent = stats.totalEmployees || '0';
            if (activeBorrowersEl) activeBorrowersEl.textContent = stats.activeBorrowers || '0';
            if (activeVouchersEl) activeVouchersEl.textContent = stats.activeVouchers || '0';
            if (outstandingAmountEl) outstandingAmountEl.textContent = `₹${(stats.outstandingAmount || 0).toLocaleString()}`;
        } else {
            console.error('Dashboard stats error:', result.message || 'Server error occurred');
            
            // Check if it's an authentication error
            if (result.message && result.message.includes('Authentication required')) {
                // Redirect to login
                window.location.href = 'login.php';
                return;
            }
            
            // Set error state for all stats
            const totalEmployeesEl = document.getElementById('total-employees');
            const activeBorrowersEl = document.getElementById('active-borrowers');
            const activeVouchersEl = document.getElementById('active-vouchers');
            const outstandingAmountEl = document.getElementById('outstanding-amount');
            
            if (totalEmployeesEl) totalEmployeesEl.textContent = 'Error';
            if (activeBorrowersEl) activeBorrowersEl.textContent = 'Error';
            if (activeVouchersEl) activeVouchersEl.textContent = 'Error';
            if (outstandingAmountEl) outstandingAmountEl.textContent = 'Error';
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        
        // Set error state for all stats
        const totalEmployeesEl = document.getElementById('total-employees');
        const activeBorrowersEl = document.getElementById('active-borrowers');
        const activeVouchersEl = document.getElementById('active-vouchers');
        const outstandingAmountEl = document.getElementById('outstanding-amount');
        
        if (totalEmployeesEl) totalEmployeesEl.textContent = 'Error';
        if (activeBorrowersEl) activeBorrowersEl.textContent = 'Error';
        if (activeVouchersEl) activeVouchersEl.textContent = 'Error';
        if (outstandingAmountEl) outstandingAmountEl.textContent = 'Error';
    }
}

/**
 * Initialize data on page load
 */
async function initializeData() {
    // Show loading message
    showNotification('Loading data...', 'info');
    
    // Load all data types
    await Promise.all([
        loadDataFromAPI('employees'),
        loadDataFromAPI('borrowers'),
        loadDataFromAPI('vouchers')
    ]);
    
    // Load dashboard stats
    await loadDashboardStats();
    
    // Update tables
    renderEmployeeTable();
    renderBorrowerTable();
    renderVoucherTable();
    updateDashboardTable();
    
    showNotification('Data loaded successfully', 'success');
}

// ========================================
// Authentication & Navigation Functions
// ========================================

/**
 * Handle user logout
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Show loading message
        showNotification('Logging out...', 'info');
        
        // Redirect to logout handler
        window.location.href = 'logout.php';
    }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && overlay && toggle) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
        toggle.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (sidebar.classList.contains('mobile-open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

/**
 * Show specific section and hide others
 * @param {string} sectionId - The ID of the section to show
 */
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId + '-content');
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Render table data based on section
        if (sectionId === 'dashboard') {
            updateDashboardStats();
        } else if (sectionId === 'employees') {
            renderEmployeeTable();
        } else if (sectionId === 'borrowers') {
            renderBorrowerTable();
        } else if (sectionId === 'vouchers') {
            renderVoucherTable();
        } else if (sectionId === 'reports') {
            updateReportsTable();
        }
    }
}

/**
 * Render employee table with current data
 */
function renderEmployeeTable() {
    const employees = data.employees;
    const tbody = document.querySelector('#employees-content .requests-table tbody');
    
    if (!tbody) return;
    
    if (Object.keys(employees).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No employees found. Click "Add New Employee" to get started.</td></tr>';
        return;
    }
    
    let html = '';
    Object.values(employees).forEach(employee => {
        // Format the created_at date
        let entryDate = 'N/A';
        if (employee.created_at) {
            const date = new Date(employee.created_at);
            entryDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            });
        }
        
        html += `
            <tr>
                <td>${employee.id}</td>
                <td>${employee.name}</td>
                <td>${entryDate}</td>
                <td>
                    <button class="view-btn" onclick="viewRecord('employee', '${employee.id}')">View</button>
                    <button class="edit-btn" onclick="editRecord('employee', '${employee.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteRecord('employee', '${employee.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Render borrower table with current data
 */
function renderBorrowerTable() {
    const borrowers = data.borrowers;
    const tbody = document.querySelector('#borrowers-content .requests-table tbody');
    
    if (!tbody) return;
    
    if (Object.keys(borrowers).length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #666;">No borrowers found. Click "Add New Borrower" to get started.</td></tr>';
        return;
    }
    
    let html = '';
    Object.values(borrowers).forEach(borrower => {
        // Format the created_at date for entry date
        let entryDate = 'N/A';
        if (borrower.created_at) {
            const date = new Date(borrower.created_at);
            entryDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            });
        }
        
        html += `
            <tr>
                <td>${borrower.applicationNo || 'N/A'}</td>
                <td>${borrower.empId}</td>
                <td>${borrower.name}</td>
                <td>₹${(borrower.amount || 0).toLocaleString()}</td>
                <td>₹${(borrower.outstandingAmount || borrower.amount || 0).toLocaleString()}</td>
                <td>₹${(borrower.emi || 0).toLocaleString()}</td>
                <td>${borrower.month || 'N/A'}</td>
                <td>${convertDateFormat(borrower.disbursedDate)}</td>
                <td>${entryDate}</td>
                <td>
                    <button class="view-btn" onclick="viewRecord('borrower', '${borrower.empId}')">View History</button>
                    <button class="edit-btn" onclick="editRecord('borrower', '${borrower.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteRecord('borrower', '${borrower.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Render voucher table with current data
 */
function renderVoucherTable() {
    const vouchers = data.vouchers;
    const tbody = document.querySelector('#vouchers-content .requests-table tbody');
    
    if (!tbody) return;
    
    if (Object.keys(vouchers).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No vouchers found. Click "Create New Voucher" to get started.</td></tr>';
        return;
    }
    
    // Group vouchers by employee
    const employeeGroups = {};
    Object.values(vouchers).forEach(voucher => {
        const empId = voucher.empId;
        if (!employeeGroups[empId]) {
            employeeGroups[empId] = {
                empId: voucher.empId,
                empName: voucher.empName,
                vouchers: [],
                totalAmount: 0
            };
        }
        employeeGroups[empId].vouchers.push(voucher);
        employeeGroups[empId].totalAmount += parseFloat(voucher.amount);
    });
    
    let html = '';
    Object.values(employeeGroups).forEach(employee => {
        html += `
            <tr>
                <td>${employee.empId}</td>
                <td>${employee.empName}</td>
                <td><span class="voucher-count">${employee.vouchers.length}</span></td>
                <td><span class="amount-total">₹${(employee.totalAmount || 0).toLocaleString()}</span></td>
                <td>
                    <button class="view-btn" onclick="viewEmployeeVouchers('${employee.empId}')">View Vouchers</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * View all vouchers for a specific employee
 * @param {string} empId - Employee ID to view vouchers for
 */
function viewEmployeeVouchers(empId) {
    const vouchers = data.vouchers;
    const employeeVouchers = Object.values(vouchers).filter(voucher => voucher.empId === empId);
    
    if (employeeVouchers.length === 0) {
        alert('No vouchers found for this employee');
        return;
    }
    
    const employee = employeeVouchers[0]; // Get employee details from first voucher
    
    let vouchersList = '';
    let totalAmount = 0;
    
    employeeVouchers.forEach((voucher, index) => {
        totalAmount += parseFloat(voucher.amount);
        vouchersList += `
            <div class="voucher-item" style="border-bottom: 1px solid #eee; padding: 10px 0; margin: 5px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Voucher #${voucher.id}</strong> - 
                        Application: <span style="color: #007bff; font-weight: bold;">${voucher.applicationNo || 'N/A'}</span> - 
                        Date: ${convertDateFormat(voucher.date)} - 
                        Month: ${voucher.month} - 
                        Amount: <span style="color: #28a745; font-weight: bold;">₹${voucher.amount}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    const content = `
        <div class="employee-vouchers-details">
            <div class="employee-header" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Employee Vouchers</h3>
                <div class="detail-row"><strong>Employee ID:</strong> ${employee.empId}</div>
                <div class="detail-row"><strong>Employee Name:</strong> ${employee.empName}</div>
                <div class="detail-row"><strong>Total Vouchers:</strong> ${employeeVouchers.length}</div>
                <div class="detail-row"><strong>Total Amount:</strong> <span style="color: #28a745; font-weight: bold;">₹${(totalAmount || 0).toLocaleString()}</span></div>
            </div>
            
            <div class="vouchers-list">
                <h4 style="margin-bottom: 15px; color: #333;">All Vouchers:</h4>
                ${vouchersList}
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-secondary" onclick="closeModal('viewModal')">Close</button>
            </div>
        </div>
    `;

    const viewModalBody = document.getElementById('viewModalBody');
    if (viewModalBody) {
        viewModalBody.innerHTML = content;
        openModal('viewModal');
    }
}

// ========================================
// Dashboard & Reports Functions  
// ========================================

/**
 * Update dashboard statistics and recent activity
 */
async function updateDashboardStats() {
    // Load fresh stats from database
    await loadDashboardStats();
    
    // Update recent activity table
    updateDashboardTable();
}

/**
 * Update dashboard activity table
 */
function updateDashboardTable() {
    const tbody = document.querySelector('#dashboard-content .requests-table tbody');
    if (!tbody) return;
    
    const activities = [];
    
    // Add borrower activities
    Object.values(data.borrowers).forEach(borrower => {
        activities.push({
            date: borrower.disbursedDate || new Date().toISOString().split('T')[0],
            applicationNo: borrower.applicationNo || 'N/A',
            employee: borrower.name,
            amount: `₹${borrower.amount}`,
            type: 'Advance',
            empId: borrower.empId,
            id: borrower.empId
        });
    });
    
    // Add voucher activities
    Object.values(data.vouchers).forEach(voucher => {
        activities.push({
            date: voucher.date || new Date().toISOString().split('T')[0],
            applicationNo: voucher.applicationNo || 'N/A',
            employee: voucher.empName,
            amount: `₹${voucher.amount}`,
            type: 'Voucher',
            empId: voucher.empId,
            id: voucher.id
        });
    });
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No recent activity found. Start by adding employees, borrowers, or vouchers.</td></tr>';
        return;
    }
    
    let html = '';
    activities.slice(0, 10).forEach(activity => { // Show only 10 recent activities
        html += `
            <tr>
                <td>${formatDate(activity.date)}</td>
                <td>${activity.applicationNo}</td>
                <td>${activity.employee}</td>
                <td>${activity.amount}</td>
                <td>${activity.type}</td>
                <td>
                    <button class="view-btn" onclick="viewActivityDetails('${activity.type}', '${activity.id}', '${activity.empId}')">View</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Update reports table with real data statistics
 */
function updateReportsTable() {
    const tbody = document.querySelector('#reports-content .requests-table tbody');
    if (!tbody) return;
    
    // Calculate real statistics from data
    const employeesCount = Object.keys(data.employees || {}).length;
    const borrowersCount = Object.keys(data.borrowers || {}).length;
    const vouchersCount = Object.keys(data.vouchers || {}).length;
    
    const totalAdvanceAmount = Object.values(data.borrowers || {}).reduce((sum, borrower) => sum + (parseFloat(borrower.amount) || 0), 0);
    const totalOutstanding = Object.values(data.borrowers || {}).reduce((sum, borrower) => sum + (parseFloat(borrower.outstandingAmount || borrower.amount) || 0), 0);
    const totalVoucherAmount = Object.values(data.vouchers || {}).reduce((sum, voucher) => sum + (parseFloat(voucher.amount) || 0), 0);
    
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const reports = [
        {
            name: 'Employee Summary Report',
            description: `${employeesCount} employees registered in the system`,
            type: 'Summary',
            lastGenerated: 'Live Data',
            status: 'Ready',
            action: 'employee',
            count: employeesCount
        },
        {
            name: 'Borrower Advance Report',
            description: `${borrowersCount} active borrowers with ₹${totalAdvanceAmount.toLocaleString()} total advances`,
            type: 'Detail',
            lastGenerated: 'Live Data',
            status: 'Ready',
            action: 'borrower',
            count: borrowersCount
        },
        {
            name: 'Outstanding Amount Report',
            description: `₹${totalOutstanding.toLocaleString()} total outstanding amount across all borrowers`,
            type: 'Analytics',
            lastGenerated: 'Live Data',
            status: 'Ready',
            action: 'outstanding',
            count: borrowersCount
        },
        {
            name: 'Voucher Transaction Report',
            description: `${vouchersCount} vouchers processed with ₹${totalVoucherAmount.toLocaleString()} total amount`,
            type: 'Detail',
            lastGenerated: 'Live Data',
            status: 'Ready',
            action: 'voucher',
            count: vouchersCount
        },
        {
            name: 'Complete System Report',
            description: 'Comprehensive report with all employees, borrowers, and vouchers',
            type: 'Complete',
            lastGenerated: 'Live Data',
            status: 'Ready',
            action: 'complete',
            count: employeesCount + borrowersCount + vouchersCount
        }
    ];
    
    let html = '';
    reports.forEach(report => {
        const statusClass = report.count > 0 ? 'status-active' : 'status-pending';
        const statusText = report.count > 0 ? 'Ready' : 'No Data';
        
        html += `
            <tr>
                <td><strong>${report.name}</strong></td>
                <td>${report.description}</td>
                <td><span class="type-badge type-${report.type.toLowerCase()}">${report.type}</span></td>
                <td>${report.lastGenerated}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="view-btn" onclick="previewReport('${report.action}')" ${report.count === 0 ? 'disabled' : ''}>
                        📋 Preview
                    </button>
                    <button class="export-btn" onclick="generateReport('${report.action}')" ${report.count === 0 ? 'disabled' : ''}>
                        📤 Export
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Generate specific report and export to Excel
 * @param {string} reportType - Type of report to generate
 */
function generateReport(reportType) {
    try {
        let reportData;
        let filename;
        
        switch(reportType) {
            case 'employee':
                reportData = generateEmployeeReport();
                filename = `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
            case 'borrower':
                reportData = generateBorrowerReport();
                filename = `Borrower_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
            case 'outstanding':
                reportData = generateOutstandingReport();
                filename = `Outstanding_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
            case 'voucher':
                reportData = generateVoucherReport();
                filename = `Voucher_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
            case 'complete':
                reportData = generateCompleteReport();
                filename = `Complete_System_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
            default:
                throw new Error('Unknown report type');
        }
        
        downloadExcel(reportData, filename);
        showNotification(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`, 'success');
        updateReportsTable(); // Refresh to show updated generation time
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report: ' + error.message, 'error');
    }
}

/**
 * Generate employee report data
 */
function generateEmployeeReport() {
    const employees = Object.values(data.employees || {}).map((employee, index) => ({
        'No': index + 1,
        'Employee ID': employee.id,
        'Employee Name': employee.name,
        'Status': 'Active',
        'Registration Date': new Date().toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(employees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Report');
    
    return workbook;
}

/**
 * Generate borrower report data
 */
function generateBorrowerReport() {
    const borrowers = Object.values(data.borrowers || {}).map((borrower, index) => ({
        'No': index + 1,
        'Application No': borrower.applicationNo || 'N/A',
        'Employee ID': borrower.empId,
        'Employee Name': borrower.name,
        'Advance Amount': `₹${borrower.amount}`,
        'Outstanding Amount': `₹${borrower.outstandingAmount || borrower.amount}`,
        'EMI Amount': `₹${borrower.emi}`,
        'Months': borrower.month,
        'Disbursed Date': borrower.disbursedDate,
        'Entry Date': borrower.created_at || new Date().toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(borrowers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Borrower Report');
    
    return workbook;
}

/**
 * Generate outstanding amount report
 */
function generateOutstandingReport() {
    const outstandingData = Object.values(data.borrowers || {})
        .filter(borrower => (borrower.outstandingAmount || borrower.amount) > 0)
        .map((borrower, index) => {
            const outstanding = borrower.outstandingAmount || borrower.amount;
            const original = borrower.amount;
            const recoveryPercentage = ((original - outstanding) / original * 100).toFixed(2);
            
            return {
                'No': index + 1,
                'Application No': borrower.applicationNo || 'N/A',
                'Employee ID': borrower.empId,
                'Employee Name': borrower.name,
                'Original Amount': `₹${original}`,
                'Outstanding Amount': `₹${outstanding}`,
                'Recovery %': `${recoveryPercentage}%`,
                'EMI Amount': `₹${borrower.emi}`,
                'Months Remaining': Math.ceil(outstanding / borrower.emi),
                'Disbursed Date': borrower.disbursedDate
            };
        });
    
    const worksheet = XLSX.utils.json_to_sheet(outstandingData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Outstanding Report');
    
    return workbook;
}

/**
 * Generate voucher report data
 */
function generateVoucherReport() {
    const vouchers = Object.values(data.vouchers || {}).map((voucher, index) => ({
        'No': index + 1,
        'Voucher No': voucher.id,
        'Application No': voucher.applicationNo || 'N/A',
        'Employee ID': voucher.empId,
        'Employee Name': voucher.empName,
        'Voucher Date': voucher.date,
        'Amount': `₹${voucher.amount}`,
        'Month': voucher.month,
        'Created Date': voucher.created_at || new Date().toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(vouchers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voucher Report');
    
    return workbook;
}

/**
 * Generate complete system report
 */
function generateCompleteReport() {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summary = [{
        'Report Type': 'System Summary',
        'Generated Date': new Date().toLocaleDateString(),
        'Total Employees': Object.keys(data.employees || {}).length,
        'Total Borrowers': Object.keys(data.borrowers || {}).length,
        'Total Vouchers': Object.keys(data.vouchers || {}).length,
        'Total Advance Amount': `₹${Object.values(data.borrowers || {}).reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0).toLocaleString()}`,
        'Total Outstanding': `₹${Object.values(data.borrowers || {}).reduce((sum, b) => sum + (parseFloat(b.outstandingAmount || b.amount) || 0), 0).toLocaleString()}`,
        'Total Voucher Amount': `₹${Object.values(data.vouchers || {}).reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0).toLocaleString()}`
    }];
    
    const summaryWS = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    
    // Add individual reports
    if (Object.keys(data.employees || {}).length > 0) {
        const employeeData = Object.values(data.employees || {}).map((emp, i) => ({
            'No': i + 1,
            'Employee ID': emp.id,
            'Name': emp.name
        }));
        const empWS = XLSX.utils.json_to_sheet(employeeData);
        XLSX.utils.book_append_sheet(workbook, empWS, 'Employees');
    }
    
    if (Object.keys(data.borrowers || {}).length > 0) {
        const borrowerWS = XLSX.utils.json_to_sheet(
            Object.values(data.borrowers || {}).map((b, i) => ({
                'No': i + 1,
                'Application No': b.applicationNo || 'N/A',
                'Employee ID': b.empId,
                'Name': b.name,
                'Amount': b.amount,
                'Outstanding': b.outstandingAmount || b.amount,
                'EMI': b.emi,
                'Months': b.month,
                'Disbursed Date': b.disbursedDate
            }))
        );
        XLSX.utils.book_append_sheet(workbook, borrowerWS, 'Borrowers');
    }
    
    if (Object.keys(data.vouchers || {}).length > 0) {
        const voucherWS = XLSX.utils.json_to_sheet(
            Object.values(data.vouchers || {}).map((v, i) => ({
                'No': i + 1,
                'Voucher No': v.id,
                'Application No': v.applicationNo || 'N/A',
                'Employee ID': v.empId,
                'Employee Name': v.empName,
                'Date': v.date,
                'Amount': v.amount,
                'Month': v.month
            }))
        );
        XLSX.utils.book_append_sheet(workbook, voucherWS, 'Vouchers');
    }
    
    return workbook;
}

/**
 * Preview report data in modal
 * @param {string} reportType - Type of report to preview
 */
function previewReport(reportType) {
    console.log('Preview report called with type:', reportType); // Debug log
    console.log('Data object available:', data); // Debug log
    
    try {
        let content = '';
        let title = '';
        
        switch(reportType) {
            case 'employee':
                content = generateEmployeePreview();
                title = 'Employee Summary Report';
                break;
            case 'borrower':
                content = generateBorrowerPreview();
                title = 'Borrower Advance Report';
                break;
            case 'outstanding':
                content = generateOutstandingPreview();
                title = 'Outstanding Amount Report';
                break;
            case 'voucher':
                content = generateVoucherPreview();
                title = 'Voucher Transaction Report';
                break;
            case 'complete':
                content = generateCompletePreview();
                title = 'Complete System Report';
                break;
            default:
                content = generateSimplePreview(reportType);
                title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
        }
        
        console.log('Generated content length:', content.length); // Debug log
        console.log('Title:', title); // Debug log
        
        const viewModalBody = document.getElementById('viewModalBody');
        const modalHeader = document.querySelector('#viewModal .modal-header h2');
        
        if (viewModalBody && modalHeader) {
            modalHeader.textContent = title;
            viewModalBody.innerHTML = content;
            console.log('Modal content set, opening modal...'); // Debug log
            openModal('viewModal');
            
            // Additional check after opening
            setTimeout(() => {
                const modal = document.getElementById('viewModal');
                console.log('Modal display style:', modal.style.display);
                console.log('Modal classes:', modal.className);
                console.log('Modal body content length:', viewModalBody.innerHTML.length);
            }, 100);
        } else {
            console.error('Modal elements not found:', { 
                viewModalBody: !!viewModalBody, 
                modalHeader: !!modalHeader,
                viewModal: !!document.getElementById('viewModal')
            });
            alert('Modal elements not found. Please refresh the page and try again.');
        }
        
    } catch (error) {
        console.error('Error previewing report:', error);
        alert('Error previewing report: ' + error.message);
    }
}

/**
 * Generate simple preview for fallback
 */
function generateSimplePreview(reportType) {
    console.log('Using simple preview for:', reportType);
    console.log('Data object:', data);
    
    return `
        <div class="report-preview">
            <div class="report-summary">
                <h3>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h3>
                <p>Report type: ${reportType}</p>
                <p>Data available: ${data ? 'Yes' : 'No'}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="report-content">
                <p>This is a preview of the ${reportType} report.</p>
                <p>Data will be processed and displayed here.</p>
            </div>
        </div>
    `;
}

/**
 * Generate employee preview HTML
 */
function generateEmployeePreview() {
    console.log('Generating employee preview, data.employees:', data.employees);
    
    const employees = Object.values(data.employees || {});
    
    if (employees.length === 0) {
        return `
            <div class="report-preview">
                <div class="report-summary">
                    <h3>Employee Summary</h3>
                    <p>No employees found in the system.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="report-preview">
            <div class="report-summary">
                <h3>Employee Summary</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${employees.length}</span>
                        <span class="stat-label">Total Employees</span>
                    </div>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Employee ID</th>
                            <th>Employee Name</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map((employee, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${employee.id}</td>
                                <td>${employee.name}</td>
                                <td><span class="status status-active">Active</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Generate borrower preview HTML
 */
function generateBorrowerPreview() {
    console.log('Generating borrower preview, data.borrowers:', data.borrowers);
    
    const borrowers = Object.values(data.borrowers || {});
    
    if (borrowers.length === 0) {
        return `
            <div class="report-preview">
                <div class="report-summary">
                    <h3>Borrower Analysis</h3>
                    <p>No borrowers found in the system.</p>
                </div>
            </div>
        `;
    }
    
    const totalAmount = borrowers.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const totalOutstanding = borrowers.reduce((sum, b) => sum + (parseFloat(b.outstandingAmount || b.amount) || 0), 0);
    
    return `
        <div class="report-preview">
            <div class="report-summary">
                <h3>Borrower Analysis</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${borrowers.length}</span>
                        <span class="stat-label">Total Borrowers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalAmount.toLocaleString()}</span>
                        <span class="stat-label">Total Advanced</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalOutstanding.toLocaleString()}</span>
                        <span class="stat-label">Outstanding</span>
                    </div>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Application No</th>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Advance Amount</th>
                            <th>Outstanding</th>
                            <th>EMI</th>
                            <th>Months</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${borrowers.map((borrower, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${borrower.applicationNo || 'N/A'}</td>
                                <td>${borrower.empId}</td>
                                <td>${borrower.name}</td>
                                <td>₹${parseFloat(borrower.amount || 0).toLocaleString()}</td>
                                <td>₹${parseFloat(borrower.outstandingAmount || borrower.amount || 0).toLocaleString()}</td>
                                <td>₹${parseFloat(borrower.emi || 0).toLocaleString()}</td>
                                <td>${borrower.month}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Generate outstanding preview HTML
 */
function generateOutstandingPreview() {
    console.log('Generating outstanding preview, data.borrowers:', data.borrowers);
    
    const borrowers = Object.values(data.borrowers || {})
        .filter(borrower => (borrower.outstandingAmount || borrower.amount) > 0);
    
    if (borrowers.length === 0) {
        return `
            <div class="report-preview">
                <div class="report-summary">
                    <h3>Outstanding Amount Analysis</h3>
                    <p>No outstanding amounts found.</p>
                </div>
            </div>
        `;
    }
    
    const totalOutstanding = borrowers.reduce((sum, b) => sum + (parseFloat(b.outstandingAmount || b.amount) || 0), 0);
    const highestOutstanding = Math.max(...borrowers.map(b => parseFloat(b.outstandingAmount || b.amount) || 0));
    
    return `
        <div class="report-preview">
            <div class="report-summary">
                <h3>Outstanding Amount Analysis</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${borrowers.length}</span>
                        <span class="stat-label">Active Loans</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalOutstanding.toLocaleString()}</span>
                        <span class="stat-label">Total Outstanding</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${highestOutstanding.toLocaleString()}</span>
                        <span class="stat-label">Highest Outstanding</span>
                    </div>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Application No</th>
                            <th>Employee</th>
                            <th>Original Amount</th>
                            <th>Outstanding</th>
                            <th>Recovery %</th>
                            <th>EMI</th>
                            <th>Months Left</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${borrowers.map((borrower, index) => {
                            const outstanding = parseFloat(borrower.outstandingAmount || borrower.amount) || 0;
                            const original = parseFloat(borrower.amount) || 0;
                            const recovery = original > 0 ? ((original - outstanding) / original * 100).toFixed(1) : 0;
                            const emi = parseFloat(borrower.emi) || 0;
                            const monthsLeft = emi > 0 ? Math.ceil(outstanding / emi) : 0;
                            
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${borrower.applicationNo || 'N/A'}</td>
                                    <td>${borrower.name}</td>
                                    <td>₹${original.toLocaleString()}</td>
                                    <td>₹${outstanding.toLocaleString()}</td>
                                    <td>${recovery}%</td>
                                    <td>₹${emi.toLocaleString()}</td>
                                    <td>${monthsLeft}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Generate voucher preview HTML
 */
function generateVoucherPreview() {
    console.log('Generating voucher preview, data.vouchers:', data.vouchers);
    
    const vouchers = Object.values(data.vouchers || {});
    
    if (vouchers.length === 0) {
        return `
            <div class="report-preview">
                <div class="report-summary">
                    <h3>Voucher Transaction Summary</h3>
                    <p>No vouchers found in the system.</p>
                </div>
            </div>
        `;
    }
    
    const totalAmount = vouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
    
    return `
        <div class="report-preview">
            <div class="report-summary">
                <h3>Voucher Transaction Summary</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${vouchers.length}</span>
                        <span class="stat-label">Total Vouchers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalAmount.toLocaleString()}</span>
                        <span class="stat-label">Total Amount</span>
                    </div>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Voucher No</th>
                            <th>Application No</th>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Month</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vouchers.map((voucher, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${voucher.id}</td>
                                <td>${voucher.applicationNo || 'N/A'}</td>
                                <td>${voucher.empName}</td>
                                <td>${voucher.date}</td>
                                <td>₹${parseFloat(voucher.amount || 0).toLocaleString()}</td>
                                <td>${voucher.month}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Generate complete preview HTML
 */
function generateCompletePreview() {
    console.log('Generating complete preview, data:', data);
    
    const employees = Object.values(data.employees || {});
    const borrowers = Object.values(data.borrowers || {});
    const vouchers = Object.values(data.vouchers || {});
    
    const totalAdvanced = borrowers.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const totalOutstanding = borrowers.reduce((sum, b) => sum + (parseFloat(b.outstandingAmount || b.amount) || 0), 0);
    const totalVoucherAmount = vouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
    
    return `
        <div class="report-preview">
            <div class="report-summary">
                <h3>Complete System Overview</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${employees.length}</span>
                        <span class="stat-label">Employees</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${borrowers.length}</span>
                        <span class="stat-label">Borrowers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${vouchers.length}</span>
                        <span class="stat-label">Vouchers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalAdvanced.toLocaleString()}</span>
                        <span class="stat-label">Total Advanced</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalOutstanding.toLocaleString()}</span>
                        <span class="stat-label">Outstanding</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${totalVoucherAmount.toLocaleString()}</span>
                        <span class="stat-label">Voucher Total</span>
                    </div>
                </div>
            </div>
            
            <div class="report-sections">
                <div class="report-section">
                    <h4>System Status</h4>
                    <div class="activity-summary">
                        <p><strong>Data Quality:</strong> ${employees.length > 0 && borrowers.length > 0 ? 'Good' : 'Needs Attention'}</p>
                        <p><strong>Recovery Rate:</strong> ${totalAdvanced > 0 ? ((totalAdvanced - totalOutstanding) / totalAdvanced * 100).toFixed(1) : 0}%</p>
                        <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate all reports
 */
function generateAllReports() {
    if (confirm('This will generate all reports. This may take a few minutes. Continue?')) {
        alert('Generating all reports...');
        // Here you would implement batch report generation
        setTimeout(() => {
            alert('All reports generated successfully!');
            updateReportsTable();
        }, 3000);
    }
}

/**
 * View activity details
 * @param {string} type - Type of activity (Advance/Voucher)
 * @param {string} id - ID of the record
 * @param {string} empId - Employee ID
 */
function viewActivityDetails(type, id, empId) {
    if (type === 'Advance') {
        // For advance, show borrowing history
        viewBorrowerHistory(empId);
    } else if (type === 'Voucher') {
        // For voucher, show voucher details
        viewRecord('voucher', id);
    } else {
        alert('Unknown activity type');
    }
}

// ========================================
// Failed Data Management Functions
// ========================================

/**
 * Add failed data entry
 * @param {string} type - Type of data (employee, borrower, voucher)
 * @param {object} data - The failed data object
 * @param {string} reason - Reason for failure
 * @param {number} rowNumber - Row number in the import file
 */
function addFailedData(type, dataObj, reason, rowNumber) {
    const failedEntry = {
        id: Date.now() + Math.random(), // Unique ID
        type: type,
        data: dataObj,
        reason: reason,
        rowNumber: rowNumber,
        timestamp: new Date().toISOString(),
        originalData: JSON.stringify(dataObj)
    };
    
    failedData[type].push(failedEntry);
    failedData.lastUpdated = new Date().toISOString();
    
    // Update the status in reports table
    updateFailedDataStatus();
    
    console.log(`Added failed ${type} data:`, failedEntry);
}

/**
 * Update failed data status in reports table
 */
function updateFailedDataStatus() {
    const statusElement = document.getElementById('failed-data-status');
    if (!statusElement) return;
    
    const totalFailed = failedData.employees.length + failedData.borrowers.length + failedData.vouchers.length;
    
    if (totalFailed === 0) {
        statusElement.textContent = 'No Errors';
        statusElement.className = 'status status-active';
    } else {
        statusElement.textContent = `${totalFailed} Failed Records`;
        statusElement.className = 'status status-warning';
    }
}

/**
 * View failed data in modal
 */
function viewFailedData() {
    const totalFailed = failedData.employees.length + failedData.borrowers.length + failedData.vouchers.length;
    
    if (totalFailed === 0) {
        alert('No failed data to display. All imports have been successful!');
        return;
    }
    
    let content = generateFailedDataReport();
    
    const viewModalBody = document.getElementById('viewModalBody');
    const modalHeader = document.querySelector('#viewModal .modal-header h2');
    
    if (viewModalBody && modalHeader) {
        modalHeader.textContent = 'Failed Data Report';
        viewModalBody.innerHTML = content;
        openModal('viewModal');
    }
}

/**
 * Generate failed data report HTML
 */
function generateFailedDataReport() {
    const totalFailed = failedData.employees.length + failedData.borrowers.length + failedData.vouchers.length;
    
    let content = `
        <div class="failed-data-report">
            <div class="report-summary">
                <h3>Import Failed Data Summary</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${failedData.employees.length}</span>
                        <span class="stat-label">Failed Employees</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${failedData.borrowers.length}</span>
                        <span class="stat-label">Failed Borrowers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${failedData.vouchers.length}</span>
                        <span class="stat-label">Failed Vouchers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalFailed}</span>
                        <span class="stat-label">Total Failed</span>
                    </div>
                </div>
                ${failedData.lastUpdated ? `<p><strong>Last Updated:</strong> ${new Date(failedData.lastUpdated).toLocaleString()}</p>` : ''}
            </div>
    `;
    
    // Add sections for each type
    ['employees', 'borrowers', 'vouchers'].forEach(type => {
        if (failedData[type].length > 0) {
            content += generateFailedDataSection(type, failedData[type]);
        }
    });
    
    content += `</div>`;
    
    return content;
}

/**
 * Generate failed data section for specific type
 */
function generateFailedDataSection(type, failedItems) {
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(0, -1); // Remove 's' and capitalize
    
    let content = `
        <div class="failed-data-section">
            <h4>Failed ${typeLabel} Data (${failedItems.length} records)</h4>
            <div class="failed-data-table-container">
                <table class="failed-data-table">
                    <thead>
                        <tr>
                            <th>Row #</th>
                            <th>Failed At</th>
                            <th>Reason</th>
                            <th>Data Preview</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    failedItems.forEach(item => {
        const dataPreview = Object.entries(item.data)
            .slice(0, 3)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        
        content += `
            <tr>
                <td>${item.rowNumber}</td>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td class="failure-reason">${item.reason}</td>
                <td class="data-preview" title="${item.originalData}">${dataPreview}...</td>
                <td>
                    <button class="view-btn" onclick="viewFailedDataDetails('${item.id}', '${type}')">Details</button>
                    <button class="delete-btn" onclick="removeFailedData('${item.id}', '${type}')">Remove</button>
                </td>
            </tr>
        `;
    });
    
    content += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return content;
}

/**
 * View detailed failed data
 */
function viewFailedDataDetails(failedId, type) {
    const failedItem = failedData[type].find(item => item.id.toString() === failedId);
    if (!failedItem) {
        alert('Failed data not found');
        return;
    }
    
    const details = `
        <div class="failed-data-details">
            <h4>Failed ${type.slice(0, -1)} Details</h4>
            <div class="detail-info">
                <p><strong>Row Number:</strong> ${failedItem.rowNumber}</p>
                <p><strong>Failed At:</strong> ${new Date(failedItem.timestamp).toLocaleString()}</p>
                <p><strong>Failure Reason:</strong> ${failedItem.reason}</p>
            </div>
            <div class="original-data">
                <h5>Original Data:</h5>
                <pre>${JSON.stringify(failedItem.data, null, 2)}</pre>
            </div>
        </div>
    `;
    
    const viewModalBody = document.getElementById('viewModalBody');
    const modalHeader = document.querySelector('#viewModal .modal-header h2');
    
    if (viewModalBody && modalHeader) {
        modalHeader.textContent = 'Failed Data Details';
        viewModalBody.innerHTML = details;
        openModal('viewModal');
    }
}

/**
 * Remove specific failed data entry
 */
function removeFailedData(failedId, type) {
    if (confirm('Are you sure you want to remove this failed data entry?')) {
        const index = failedData[type].findIndex(item => item.id.toString() === failedId);
        if (index > -1) {
            failedData[type].splice(index, 1);
            updateFailedDataStatus();
            // Refresh the view if modal is open
            if (document.getElementById('viewModal').style.display === 'block') {
                viewFailedData();
            }
            showNotification('Failed data entry removed', 'success');
        }
    }
}

/**
 * Clear all failed data
 */
function clearFailedData() {
    const totalFailed = failedData.employees.length + failedData.borrowers.length + failedData.vouchers.length;
    
    if (totalFailed === 0) {
        alert('No failed data to clear.');
        return;
    }
    
    if (confirm(`Are you sure you want to clear all ${totalFailed} failed data entries? This action cannot be undone.`)) {
        failedData.employees = [];
        failedData.borrowers = [];
        failedData.vouchers = [];
        failedData.lastUpdated = null;
        
        updateFailedDataStatus();
        showNotification('All failed data cleared', 'success');
        
        // Close modal if open
        if (document.getElementById('viewModal').style.display === 'block') {
            closeModal('viewModal');
        }
    }
}

/**
 * Test function to add sample failed data (for demonstration)
 */
function addTestFailedData() {
    // Add some test failed data for demonstration
    addFailedData('employees', {id: '', name: 'John Doe'}, 'Missing Employee ID', 2);
    addFailedData('employees', {id: 'EMP001', name: ''}, 'Missing Employee Name', 3);
    addFailedData('borrowers', {empId: 'EMP999', name: 'Jane Smith', amount: 'invalid'}, 'Invalid amount format', 5);
    addFailedData('vouchers', {empId: '', voucherNo: 'V001', amount: 5000}, 'Missing Employee ID', 7);
    
    showNotification('Test failed data added for demonstration', 'warning');
}

// Make test function available globally for debugging
window.addTestFailedData = addTestFailedData;

/**
 * Format date for display
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ========================================
// Modal Management Functions
// ========================================

/**
 * Open modal dialog
 * @param {string} modalId - The ID of the modal to open
 */
function openModal(modalId) {
    console.log('Opening modal:', modalId, 'with fullscreen support'); // Debug log
    const modal = document.getElementById(modalId);
    if (modal) {
        // Add fullscreen class for view modal
        if (modalId === 'viewModal') {
            modal.classList.add('fullscreen');
            console.log('Added fullscreen class to viewModal'); // Debug log
        }
        
        // Force display with important properties
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '9999';
        
        document.body.style.overflow = 'hidden';
        
        // Log modal state
        console.log('Modal opened - display:', modal.style.display);
        console.log('Modal opened - visibility:', modal.style.visibility);
        console.log('Modal opened - classes:', modal.className);
        
        // Ensure modal content is properly displayed
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.display = 'flex';
            modalContent.style.flexDirection = 'column';
            console.log('Modal content styled');
        }
    } else {
        console.error('Modal not found:', modalId);
    }
}

/**
 * Close modal dialog
 * @param {string} modalId - The ID of the modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Remove fullscreen class when closing
        modal.classList.remove('fullscreen');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// Record Management Functions
// ========================================

/**
 * View record details in a modal
 * @param {string} type - Type of record (employee, borrower, voucher)
 * @param {string} id - ID of the record to view
 */
function viewRecord(type, id) {
    if (type === 'borrower') {
        // For borrowers, show borrowing history instead of single record
        viewBorrowerHistory(id);
        return;
    }
    
    const record = data[type + 's'][id];
    if (!record) {
        alert('Record not found');
        return;
    }

    let content = '';
    switch(type) {
        case 'employee':
            content = `
                <div class="record-details">
                    <div class="detail-row"><strong>Employee ID:</strong> ${record.id}</div>
                    <div class="detail-row"><strong>Employee Name:</strong> ${record.name}</div>
                </div>
            `;
            break;
        case 'voucher':
            content = `
                <div class="voucher-details">
                    <div class="voucher-info">
                        <h3>Voucher Information</h3>
                        <div class="detail-row"><strong>Voucher No:</strong> ${record.id}</div>
                        <div class="detail-row"><strong>Application Number:</strong> ${record.applicationNo || 'N/A'}</div>
                        <div class="detail-row"><strong>Voucher Date:</strong> ${convertDateFormat(record.date)}</div>
                        <div class="detail-row"><strong>Month:</strong> ${record.month}</div>
                        <div class="detail-row"><strong>Amount:</strong> ₹${(record.amount || 0).toLocaleString()}</div>
                    </div>
                    
                    <div class="employee-info">
                        <h3>Employee Information</h3>
                        <div class="detail-row"><strong>Employee ID:</strong> ${record.empId}</div>
                        <div class="detail-row"><strong>Employee Name:</strong> ${record.empName}</div>
                    </div>
                </div>
            `;
            break;
    }

    const viewModalBody = document.getElementById('viewModalBody');
    if (viewModalBody) {
        viewModalBody.innerHTML = content;
        openModal('viewModal');
    }
}

/**
 * View borrowing history for an employee
 */
async function viewBorrowerHistory(empId) {
    try {
        const response = await fetch(`api.php?action=get_borrower_history&empId=${empId}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
            throw new Error('Invalid JSON response');
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success) {
            const historyData = result.data;
            
            // Create history modal content
            let content = `
                <div class="borrower-history">
                    <div class="employee-info">
                        <h3>Employee Information</h3>
                        <div class="detail-row"><strong>Employee ID:</strong> ${historyData.employee.id}</div>
                        <div class="detail-row"><strong>Name:</strong> ${historyData.employee.name}</div>
                        <div class="detail-row"><strong>Status:</strong> ${historyData.employee.status}</div>
                    </div>
                    
                    <div class="borrowing-summary">
                        <h3>Borrowing Summary</h3>
                        <div class="summary-cards">
                            <div class="summary-card">
                                <div class="summary-value">${historyData.summary.totalBorrowings}</div>
                                <div class="summary-label">Total Borrowings</div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-value">${historyData.summary.activeBorrowings}</div>
                                <div class="summary-label">Active</div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-value">${historyData.summary.completedBorrowings}</div>
                                <div class="summary-label">Completed</div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-value">₹${(historyData.summary.totalOutstanding || 0).toLocaleString()}</div>
                                <div class="summary-label">Outstanding</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="borrowing-history">
                        <h3>Borrowing History</h3>
                        <div class="history-table-container">
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>Application No</th>
                                        <th>Amount</th>
                                        <th>Outstanding</th>
                                        <th>EMI</th>
                                        <th>Months</th>
                                        <th>Disbursed Date</th>
                                        <th>Status</th>
                                        <th>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            if (historyData.history.length === 0) {
                content += '<tr><td colspan="8" style="text-align: center; padding: 20px;">No borrowing history found</td></tr>';
            } else {
                historyData.history.forEach(record => {
                    const statusClass = record.status === 'active' ? 'status-active' : 
                                       record.status === 'completed' ? 'status-completed' : 'status-cancelled';
                    
                    const createdDate = new Date(record.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    });
                    
                    content += `
                        <tr>
                            <td>${record.applicationNo || 'N/A'}</td>
                            <td>₹${(record.amount || 0).toLocaleString()}</td>
                            <td>₹${(record.outstandingAmount || 0).toLocaleString()}</td>
                            <td>₹${(record.emi || 0).toLocaleString()}</td>
                            <td>${record.months || 'N/A'}</td>
                            <td>${record.disbursedDate}</td>
                            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
                            <td>${createdDate}</td>
                        </tr>
                    `;
                });
            }
            
            content += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            const viewModalBody = document.getElementById('viewModalBody');
            if (viewModalBody) {
                viewModalBody.innerHTML = content;
                document.querySelector('#viewModal .modal-header h2').textContent = 'Borrowing History';
                openModal('viewModal');
            }
        } else {
            alert('Error loading borrowing history: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading borrowing history:', error);
        alert('Error loading borrowing history. Please try again.');
    }
}

/**
 * Edit record in a modal form
 * @param {string} type - Type of record (employee, borrower, voucher)
 * @param {string} id - ID of the record to edit
 */
function editRecord(type, id) {
    const record = data[type + 's'][id];
    if (!record) {
        alert('Record not found');
        return;
    }

    let formFields = '';
    switch(type) {
        case 'employee':
            formFields = `
                <div class="form-group">
                    <label>Employee ID:</label>
                    <input type="text" name="id" value="${record.id}" readonly>
                </div>
                <div class="form-group">
                    <label>Employee Name:</label>
                    <input type="text" name="name" value="${record.name || ''}" required>
                </div>
            `;
            break;
        case 'borrower':
            formFields = `
                <input type="hidden" name="id" value="${record.id}">
                <div class="form-group">
                    <label>Employee ID:</label>
                    <input type="text" name="empId" value="${record.empId}" readonly>
                </div>
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" name="name" value="${record.name}" required>
                </div>
                <div class="form-group">
                    <label>Advance Amount:</label>
                    <input type="number" name="amount" value="${record.amount}" required>
                </div>
                <div class="form-group">
                    <label>Month:</label>
                    <input type="number" name="month" value="${record.month}" required min="1" max="60">
                </div>
                <div class="form-group">
                    <label>EMI:</label>
                    <input type="number" name="emi" value="${record.emi}" required>
                </div>
                <div class="form-group">
                    <label>Disbursed Date:</label>
                    <input type="date" name="disbursedDate" value="${convertDateToHTMLFormat(record.disbursedDate)}" required>
                </div>
            `;
            break;
        case 'voucher':
            formFields = `
                <input type="hidden" name="auto_id" value="${record.auto_id}">
                <div class="form-group">
                    <label>Voucher No:</label>
                    <input type="text" name="id" value="${record.id}" required>
                </div>
                <div class="form-group">
                    <label>Employee ID:</label>
                    <input type="text" name="empId" value="${record.empId}" required>
                </div>
                <div class="form-group">
                    <label>Employee Name:</label>
                    <input type="text" name="empName" value="${record.empName}" required>
                </div>
                <div class="form-group">
                    <label>Application Number:</label>
                    <input type="text" name="applicationNo" value="${record.applicationNo || ''}" readonly style="background-color: #f8f9fa;">
                    <small style="color: #666; font-size: 12px;">Application number cannot be changed after creation</small>
                </div>
                <div class="form-group">
                    <label>Voucher Date:</label>
                    <input type="date" name="date" value="${convertDateToHTMLFormat(record.date)}" required>
                </div>
                <div class="form-group">
                    <label>Amount:</label>
                    <input type="number" name="amount" value="${record.amount}" required>
                </div>
                <div class="form-group">
                    <label>Month:</label>
                    <select name="month" required>
                        <option value="">Select Month</option>
                        <option value="January" ${record.month === 'January' ? 'selected' : ''}>January</option>
                        <option value="February" ${record.month === 'February' ? 'selected' : ''}>February</option>
                        <option value="March" ${record.month === 'March' ? 'selected' : ''}>March</option>
                        <option value="April" ${record.month === 'April' ? 'selected' : ''}>April</option>
                        <option value="May" ${record.month === 'May' ? 'selected' : ''}>May</option>
                        <option value="June" ${record.month === 'June' ? 'selected' : ''}>June</option>
                        <option value="July" ${record.month === 'July' ? 'selected' : ''}>July</option>
                        <option value="August" ${record.month === 'August' ? 'selected' : ''}>August</option>
                        <option value="September" ${record.month === 'September' ? 'selected' : ''}>September</option>
                        <option value="October" ${record.month === 'October' ? 'selected' : ''}>October</option>
                        <option value="November" ${record.month === 'November' ? 'selected' : ''}>November</option>
                        <option value="December" ${record.month === 'December' ? 'selected' : ''}>December</option>
                    </select>
                </div>
            `;
            break;
    }

    const editFormFields = document.getElementById('editFormFields');
    const editForm = document.getElementById('editForm');
    if (editFormFields && editForm) {
        editFormFields.innerHTML = formFields;
        editForm.setAttribute('data-type', type);
        editForm.setAttribute('data-id', id);
        
        // Add EMI auto-calculation for borrower edit forms
        if (type === 'borrower') {
            setTimeout(() => {
                const amountInput = editFormFields.querySelector('input[name="amount"]');
                const monthInput = editFormFields.querySelector('input[name="month"]');
                const emiInput = editFormFields.querySelector('input[name="emi"]');
                
                // Auto-calculate EMI based on amount and month
                function calculateEMI() {
                    const amount = parseFloat(amountInput.value) || 0;
                    const months = parseFloat(monthInput.value) || 0;
                    
                    if (amount > 0 && months > 0) {
                        const calculatedEMI = Math.ceil(amount / months);
                        emiInput.value = calculatedEMI;
                    }
                }
                
                // Auto-calculate month based on amount and EMI (alternative calculation)
                function calculateMonth() {
                    const amount = parseFloat(amountInput.value) || 0;
                    const emi = parseFloat(emiInput.value) || 0;
                    
                    if (amount > 0 && emi > 0) {
                        const calculatedMonths = Math.ceil(amount / emi);
                        monthInput.value = calculatedMonths;
                    }
                }
                
                if (amountInput && emiInput && monthInput) {
                    // Calculate EMI when amount or month changes
                    amountInput.addEventListener('input', calculateEMI);
                    monthInput.addEventListener('input', calculateEMI);
                    
                    // Calculate month when EMI changes (as backup)
                    emiInput.addEventListener('input', calculateMonth);
                }
            }, 100);
        }
        
        openModal('editModal');
    }
}

/**
 * Add new record
 * @param {string} type - Type of record (employee, borrower, voucher)
 */
function addRecord(type) {
    let formFields = '';
    let title = '';
    
    switch(type) {
        case 'employee':
            title = 'Add New Employee';
            formFields = `
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label>Employee ID:</label>
                            <input type="text" name="id" required placeholder="EMP004">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>Employee Name:</label>
                            <input type="text" name="name" required placeholder="Enter full name">
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'borrower':
            title = 'Add New Borrower';
            const todayDate = new Date().toISOString().split('T')[0];
            formFields = `
                <div class="form-group">
                    <label>Application Number (Optional):</label>
                    <input type="text" name="applicationNo" placeholder="Leave empty for auto-generation" maxlength="50">
                    <small style="color: #666; font-size: 12px;">If left empty, application number will be auto-generated</small>
                </div>
                <div class="form-group">
                    <label>Employee ID:</label>
                    <input type="text" id="borrower-empId" name="empId" required placeholder="EMP001">
                </div>
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="borrower-name" name="name" required placeholder="Enter employee name">
                </div>
                <div class="form-group">
                    <label>Advance Amount:</label>
                    <input type="number" name="amount" required placeholder="1000">
                </div>
                <div class="form-group">
                    <label>Month:</label>
                    <input type="number" name="month" required placeholder="5" min="1" max="60">
                </div>
                <div class="form-group">
                    <label>EMI:</label>
                    <input type="number" name="emi" required placeholder="200">
                </div>
                <div class="form-group">
                    <label>Disbursed Date:</label>
                    <input type="date" name="disbursedDate" value="${todayDate}" required>
                </div>
            `;
            break;
        case 'voucher':
            title = 'Create New Voucher';
            const today = new Date().toISOString().split('T')[0];
            formFields = `
                <div class="form-group">
                    <label>Employee ID:</label>
                    <input type="text" id="voucher-empId" name="empId" required placeholder="EMP001">
                </div>
                <div class="form-group">
                    <label>Employee Name:</label>
                    <input type="text" id="voucher-empName" name="empName" required placeholder="Enter employee name">
                </div>
                <div class="form-group" id="applicationNoGroup" style="display: none;">
                    <label>Application Number:</label>
                    <select id="voucher-applicationNo" name="applicationNo" required>
                        <option value="">Select Application Number</option>
                    </select>
                    <small style="color: #666; font-size: 12px;">Select the advance application for this voucher</small>
                </div>
                <div class="form-group">
                    <label>Voucher No:</label>
                    <input type="text" name="id" required placeholder="VCH-004">
                </div>
                <div class="form-group">
                    <label>Voucher Date:</label>
                    <input type="date" name="date" value="${today}" required>
                </div>
                <div class="form-group">
                    <label>Amount:</label>
                    <input type="number" name="amount" required placeholder="1000">
                </div>
                <div class="form-group">
                    <label>Month:</label>
                    <select name="month" required>
                        <option value="">Select Month</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                    </select>
                </div>
            `;
            break;
    }

    const addModalTitle = document.getElementById('addModalTitle');
    const addFormFields = document.getElementById('addFormFields');
    const addForm = document.getElementById('addForm');
    
    if (addModalTitle && addFormFields && addForm) {
        addModalTitle.textContent = title;
        addFormFields.innerHTML = formFields;
        addForm.setAttribute('data-type', type);
        openModal('addModal');
        
        // Add event listeners for borrower form
        if (type === 'borrower') {
            setTimeout(() => {
                const empIdInput = document.getElementById('borrower-empId');
                const nameInput = document.getElementById('borrower-name');
                const amountInput = document.querySelector('input[name="amount"]');
                const emiInput = document.querySelector('input[name="emi"]');
                const monthInput = document.querySelector('input[name="month"]');
                
                // Auto-fill employee name when Employee ID is entered
                if (empIdInput && nameInput) {
                    empIdInput.addEventListener('input', function() {
                        const empId = this.value.trim();
                        if (empId && data.employees && data.employees[empId]) {
                            nameInput.value = data.employees[empId].name;
                            nameInput.style.backgroundColor = '#e8f5e8'; // Light green to show auto-filled
                        } else {
                            nameInput.value = '';
                            nameInput.style.backgroundColor = '';
                        }
                    });
                    
                    // Also trigger on blur for better UX
                    empIdInput.addEventListener('blur', function() {
                        const empId = this.value.trim();
                        if (empId && data.employees && data.employees[empId]) {
                            nameInput.value = data.employees[empId].name;
                            nameInput.style.backgroundColor = '#e8f5e8';
                        } else if (empId && (!data.employees || !data.employees[empId])) {
                            nameInput.value = '';
                            nameInput.style.backgroundColor = '#ffe8e8'; // Light red for invalid ID
                            nameInput.placeholder = 'Employee ID not found';
                        }
                    });
                }
                
                // Auto-calculate EMI based on amount and month
                function calculateEMI() {
                    const amount = parseFloat(amountInput.value) || 0;
                    const months = parseFloat(monthInput.value) || 0;
                    
                    if (amount > 0 && months > 0) {
                        const calculatedEMI = Math.ceil(amount / months);
                        emiInput.value = calculatedEMI;
                    }
                }
                
                // Auto-calculate month based on amount and EMI (alternative calculation)
                function calculateMonth() {
                    const amount = parseFloat(amountInput.value) || 0;
                    const emi = parseFloat(emiInput.value) || 0;
                    
                    if (amount > 0 && emi > 0) {
                        const calculatedMonths = Math.ceil(amount / emi);
                        monthInput.value = calculatedMonths;
                    }
                }
                
                if (amountInput && emiInput && monthInput) {
                    // Calculate EMI when amount or month changes
                    amountInput.addEventListener('input', calculateEMI);
                    monthInput.addEventListener('input', calculateEMI);
                    
                    // Calculate month when EMI changes (as backup)
                    emiInput.addEventListener('input', calculateMonth);
                }
            }, 100);
        }
        
        // Add event listeners for voucher form
        if (type === 'voucher') {
            setTimeout(() => {
                const empIdInput = document.getElementById('voucher-empId');
                const empNameInput = document.getElementById('voucher-empName');
                const applicationNoSelect = document.getElementById('voucher-applicationNo');
                const applicationNoGroup = document.getElementById('applicationNoGroup');
                
                // Function to populate application numbers for an employee
                async function populateApplicationNumbers(empId) {
                    if (!applicationNoSelect || !applicationNoGroup) {
                        return;
                    }
                    
                    try {
                        // Clear existing options
                        applicationNoSelect.innerHTML = '<option value="">Select Application Number</option>';
                        
                        // Get borrowing history for this employee
                        const response = await fetch(`api.php?action=get_borrower_history&empId=${empId}`, {
                            credentials: 'same-origin'
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            if (result.success && result.data.history.length > 0) {
                                // Filter only active borrowings
                                const activeBorrowings = result.data.history.filter(record => record.status === 'active');
                                
                                if (activeBorrowings.length > 1) {
                                    // Show dropdown only if employee has multiple active borrowings
                                    applicationNoGroup.style.display = 'block';
                                    applicationNoSelect.required = true;
                                    
                                    activeBorrowings.forEach(borrowing => {
                                        const option = document.createElement('option');
                                        option.value = borrowing.applicationNo;
                                        option.textContent = `${borrowing.applicationNo} - ₹${(borrowing.amount || 0).toLocaleString()} (Outstanding: ₹${(borrowing.outstandingAmount || 0).toLocaleString()})`;
                                        applicationNoSelect.appendChild(option);
                                    });
                                } else if (activeBorrowings.length === 1) {
                                    // Auto-select if only one active borrowing
                                    applicationNoGroup.style.display = 'block';
                                    applicationNoSelect.required = false;
                                    
                                    const borrowing = activeBorrowings[0];
                                    const option = document.createElement('option');
                                    option.value = borrowing.applicationNo;
                                    option.textContent = `${borrowing.applicationNo} - ₹${(borrowing.amount || 0).toLocaleString()} (Outstanding: ₹${(borrowing.outstandingAmount || 0).toLocaleString()})`;
                                    option.selected = true;
                                    applicationNoSelect.appendChild(option);
                                } else {
                                    // No active borrowings
                                    applicationNoGroup.style.display = 'none';
                                    applicationNoSelect.required = false;
                                }
                            } else {
                                // No borrowing history
                                applicationNoGroup.style.display = 'none';
                                applicationNoSelect.required = false;
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching application numbers:', error);
                        applicationNoGroup.style.display = 'none';
                        applicationNoSelect.required = false;
                    }
                }
                
                // Auto-fill employee name when Employee ID is entered
                if (empIdInput && empNameInput) {
                    empIdInput.addEventListener('input', function() {
                        const empId = this.value.trim();
                        if (empId && data.employees && data.employees[empId]) {
                            empNameInput.value = data.employees[empId].name;
                            empNameInput.style.backgroundColor = '#e8f5e8'; // Light green to show auto-filled
                            // Populate application numbers for this employee
                            populateApplicationNumbers(empId);
                        } else {
                            empNameInput.value = '';
                            empNameInput.style.backgroundColor = '';
                            // Hide application number dropdown
                            if (applicationNoGroup) {
                                applicationNoGroup.style.display = 'none';
                                if (applicationNoSelect) applicationNoSelect.required = false;
                            }
                        }
                    });
                    
                    // Also trigger on blur for better UX
                    empIdInput.addEventListener('blur', function() {
                        const empId = this.value.trim();
                        if (empId && data.employees && data.employees[empId]) {
                            empNameInput.value = data.employees[empId].name;
                            empNameInput.style.backgroundColor = '#e8f5e8';
                            // Populate application numbers for this employee
                            populateApplicationNumbers(empId);
                        } else if (empId && (!data.employees || !data.employees[empId])) {
                            empNameInput.value = '';
                            empNameInput.style.backgroundColor = '#ffe8e8'; // Light red for invalid ID
                            empNameInput.placeholder = 'Employee ID not found';
                            // Hide application number dropdown
                            if (applicationNoGroup) {
                                applicationNoGroup.style.display = 'none';
                                if (applicationNoSelect) applicationNoSelect.required = false;
                            }
                        }
                    });
                }
            }, 100);
        }
    }
}

/**
 * Delete record confirmation
 * @param {string} type - Type of record (employee, borrower, voucher)
 * @param {string} id - ID of the record to delete
 */
function deleteRecord(type, id) {
    currentDeleteType = type;
    currentDeleteId = id;
    openModal('deleteModal');
}

// ========================================
// Export/Import Functions
// ========================================

/**
 * Export data to Excel
 * @param {string} type - Type of data to export
 */
function exportData(type) {
    const records = data[type + 's'];
    const excelData = convertToExcel(records, type);
    downloadExcel(excelData, `${type}s_export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export all data to Excel
 */
function exportAllData() {
    const allData = {
        employees: data.employees,
        borrowers: data.borrowers,
        vouchers: data.vouchers
    };
    
    // Create workbook with multiple sheets
    const workbook = createMultiSheetWorkbook(allData);
    downloadExcel(workbook, `complete_export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Import data from Excel
 * @param {string} type - Type of data to import
 */
function importData(type) {
    currentImportType = type;
    const excelFileInput = document.getElementById('excelFileInput');
    const importPreview = document.getElementById('importPreview');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    
    if (excelFileInput) excelFileInput.value = '';
    if (importPreview) importPreview.style.display = 'none';
    if (confirmImportBtn) confirmImportBtn.disabled = true;
    
    openModal('importModal');
}

/**
 * Convert data to Excel format
 * @param {Object} records - Records to convert
 * @param {string} type - Type of records
 * @returns {Object} Excel workbook
 */
function convertToExcel(records, type) {
    if (Object.keys(records).length === 0) {
        return createEmptyWorkbook();
    }
    
    let orderedData;
    if (type === 'borrower') {
        // Ensure borrower data follows the correct field order with all required fields
        orderedData = Object.values(records).map((record, index) => ({
            no: index + 1,
            applicationNo: record.applicationNo || '',
            empId: record.empId,
            name: record.name,
            advanceAmount: record.amount,
            outstandingAmount: record.outstandingAmount || record.amount,
            emi: record.emi,
            month: record.month,
            disbursedDate: record.disbursedDate,
            entryDate: record.created_at || record.entryDate || new Date().toISOString().split('T')[0]
        }));
    } else if (type === 'employee') {
        // Ensure employee data follows the correct field order
        orderedData = Object.values(records).map(record => ({
            id: record.id,
            name: record.name
        }));
    } else if (type === 'voucher') {
        // Ensure voucher data follows the correct field order with application number
        orderedData = Object.values(records).map(record => ({
            id: record.id,
            applicationNo: record.applicationNo || '',
            empId: record.empId,
            empName: record.empName,
            date: record.date,
            amount: record.amount,
            month: record.month
        }));
    } else {
        // For other types, use as-is
        orderedData = Object.values(records);
    }
    
    const worksheet = XLSX.utils.json_to_sheet(orderedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1) + 's');
    
    return workbook;
}

/**
 * Create multi-sheet workbook
 * @param {Object} allData - All data to include
 * @returns {Object} Excel workbook
 */
function createMultiSheetWorkbook(allData) {
    const workbook = XLSX.utils.book_new();
    
    // Add Employees sheet
    if (Object.keys(allData.employees).length > 0) {
        const orderedEmployees = Object.values(allData.employees).map(record => ({
            id: record.id,
            name: record.name
        }));
        const employeesWS = XLSX.utils.json_to_sheet(orderedEmployees);
        XLSX.utils.book_append_sheet(workbook, employeesWS, 'Employees');
    }
    
    // Add Borrowers sheet
    if (Object.keys(allData.borrowers).length > 0) {
        const orderedBorrowers = Object.values(allData.borrowers).map((record, index) => ({
            no: index + 1,
            applicationNo: record.applicationNo || '',
            empId: record.empId,
            name: record.name,
            advanceAmount: record.amount,
            outstandingAmount: record.outstandingAmount || record.amount,
            emi: record.emi,
            month: record.month,
            disbursedDate: record.disbursedDate,
            entryDate: record.created_at || record.entryDate || new Date().toISOString().split('T')[0]
        }));
        const borrowersWS = XLSX.utils.json_to_sheet(orderedBorrowers);
        XLSX.utils.book_append_sheet(workbook, borrowersWS, 'Borrowers');
    }
    
    // Add Vouchers sheet
    if (Object.keys(allData.vouchers).length > 0) {
        const orderedVouchers = Object.values(allData.vouchers).map(record => ({
            id: record.id,
            applicationNo: record.applicationNo || '',
            empId: record.empId,
            empName: record.empName,
            date: record.date,
            amount: record.amount,
            month: record.month
        }));
        const vouchersWS = XLSX.utils.json_to_sheet(orderedVouchers);
        XLSX.utils.book_append_sheet(workbook, vouchersWS, 'Vouchers');
    }
    
    return workbook;
}

/**
 * Create empty workbook
 * @returns {Object} Empty Excel workbook
 */
function createEmptyWorkbook() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([['No data available']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    return workbook;
}

/**
 * Download Excel file
 * @param {Object} workbook - Excel workbook to download
 * @param {string} filename - Name of the file
 */
function downloadExcel(workbook, filename) {
    if (typeof XLSX !== 'undefined') {
        XLSX.writeFile(workbook, filename);
        showNotification('Excel file exported successfully!', 'success');
    } else {
        alert('Excel library not loaded. Please refresh the page and try again.');
    }
}

/**
 * Download template file
 */
function downloadTemplate() {
    if (!currentImportType) return;
    
    let templateData = [];
    switch(currentImportType) {
        case 'employee':
            templateData = [{
                id: 'EMP001',
                name: 'John Doe'
            }];
            break;
        case 'borrower':
            templateData = [{
                applicationNo: 'APP000001',
                empId: 'EMP001',
                name: 'John Doe',
                amount: 1000,
                month: 5,
                emi: 200,
                disbursedDate: '01-08-2025'
            }];
            break;
        case 'voucher':
            templateData = [{
                id: 'VCH-001',
                empId: 'EMP001',
                empName: 'John Doe',
                date: '05-08-2025',
                amount: 1000,
                month: 'January'
            }];
            break;
    }
    
    if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, currentImportType.charAt(0).toUpperCase() + currentImportType.slice(1) + 's');
        
        XLSX.writeFile(workbook, `${currentImportType}_template.xlsx`);
        showNotification('Template downloaded successfully!', 'success');
    } else {
        alert('Excel library not loaded. Please refresh the page and try again.');
    }
}

/**
 * Handle file selection for import
 * @param {Event} event - File input change event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                file.type === 'application/vnd.ms-excel' ||
                file.name.endsWith('.xlsx') || 
                file.name.endsWith('.xls'))) {
        
        if (typeof XLSX === 'undefined') {
            alert('Excel library not loaded. Please refresh the page and try again.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length > 0) {
                previewImportData(jsonData);
            } else {
                alert('No data found in the Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please select a valid Excel file (.xlsx or .xls).');
    }
}

/**
 * Preview import data
 * @param {Array} jsonData - Data to preview
 */
function previewImportData(jsonData) {
    if (!jsonData || jsonData.length === 0) {
        const importPreview = document.getElementById('importPreview');
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        if (importPreview) importPreview.style.display = 'none';
        if (confirmImportBtn) confirmImportBtn.disabled = true;
        return;
    }

    try {
        // Validate required columns for each type
        if (currentImportType === 'employee') {
            validateEmployeeData(jsonData);
        } else if (currentImportType === 'borrower') {
            validateBorrowerData(jsonData);
        } else if (currentImportType === 'voucher') {
            validateVoucherData(jsonData);
        }
        
        displayPreview(jsonData);
        importPreviewData = jsonData;
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        if (confirmImportBtn) confirmImportBtn.disabled = false;
    } catch (error) {
        alert('Error processing Excel data: ' + error.message);
        const importPreview = document.getElementById('importPreview');
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        if (importPreview) importPreview.style.display = 'none';
        if (confirmImportBtn) confirmImportBtn.disabled = true;
    }
}

/**
 * Validate employee data structure
 * @param {Array} data - Data to validate
 */
function validateEmployeeData(data) {
    if (data.length === 0) return;
    
    const firstRow = data[0];
    const hasId = firstRow.hasOwnProperty('id') || firstRow.hasOwnProperty('ID') || firstRow.hasOwnProperty('Id');
    const hasName = firstRow.hasOwnProperty('name') || firstRow.hasOwnProperty('NAME') || firstRow.hasOwnProperty('Name');
    
    if (!hasId) {
        throw new Error('Excel file must contain an "id" column for Employee ID.');
    }
    if (!hasName) {
        throw new Error('Excel file must contain a "name" column for Employee Name.');
    }
    
    // Validate each row and track failed entries
    data.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because arrays are 0-indexed and Excel has header row
        
        // Normalize column names to lowercase for consistency
        if (row.hasOwnProperty('ID')) row.id = row.ID;
        if (row.hasOwnProperty('Id')) row.id = row.Id;
        if (row.hasOwnProperty('NAME')) row.name = row.NAME;
        if (row.hasOwnProperty('Name')) row.name = row.Name;
        
        // Validate required fields
        if (!row.id || row.id.toString().trim() === '') {
            addFailedData('employees', row, 'Missing or empty Employee ID', rowNumber);
        } else if (!row.name || row.name.toString().trim() === '') {
            addFailedData('employees', row, 'Missing or empty Employee Name', rowNumber);
        } else if (data.employees && data.employees[row.id]) {
            addFailedData('employees', row, `Duplicate Employee ID: ${row.id}`, rowNumber);
        }
    });
}

/**
 * Validate borrower data structure
 * @param {Array} data - Data to validate
 */
function validateBorrowerData(data) {
    if (data.length === 0) return;
    
    const firstRow = data[0];
    const hasEmpId = firstRow.hasOwnProperty('empId') || firstRow.hasOwnProperty('Employee ID') || firstRow.hasOwnProperty('employeeId');
    const hasName = firstRow.hasOwnProperty('name') || firstRow.hasOwnProperty('NAME') || firstRow.hasOwnProperty('Name');
    const hasAmount = firstRow.hasOwnProperty('amount') || firstRow.hasOwnProperty('Amount') || firstRow.hasOwnProperty('Advance Amount') || firstRow.hasOwnProperty('advanceAmount');
    const hasMonth = firstRow.hasOwnProperty('month') || firstRow.hasOwnProperty('Month') || firstRow.hasOwnProperty('MONTH');
    const hasEmi = firstRow.hasOwnProperty('emi') || firstRow.hasOwnProperty('EMI') || firstRow.hasOwnProperty('Emi');
    const hasDisbursedDate = firstRow.hasOwnProperty('disbursedDate') || firstRow.hasOwnProperty('Disbursed Date') || firstRow.hasOwnProperty('disbursed_date');
    
    if (!hasEmpId) {
        throw new Error('Excel file must contain an "empId" or "Employee ID" column.');
    }
    if (!hasName) {
        throw new Error('Excel file must contain a "name" column.');
    }
    if (!hasAmount) {
        throw new Error('Excel file must contain an "amount", "Advance Amount", or "advanceAmount" column.');
    }
    if (!hasMonth) {
        throw new Error('Excel file must contain a "month" column.');
    }
    if (!hasEmi) {
        throw new Error('Excel file must contain an "emi" or "EMI" column.');
    }
    if (!hasDisbursedDate) {
        throw new Error('Excel file must contain a "disbursedDate" or "Disbursed Date" column.');
    }
    
    // Normalize column names for consistency
    data.forEach(row => {
        if (row.hasOwnProperty('Employee ID')) row.empId = row['Employee ID'];
        if (row.hasOwnProperty('employeeId')) row.empId = row.employeeId;
        if (row.hasOwnProperty('NAME')) row.name = row.NAME;
        if (row.hasOwnProperty('Name')) row.name = row.Name;
        if (row.hasOwnProperty('Amount')) row.amount = row.Amount;
        if (row.hasOwnProperty('Advance Amount')) row.amount = row['Advance Amount'];
        if (row.hasOwnProperty('advanceAmount')) row.amount = row.advanceAmount;
        if (row.hasOwnProperty('Outstanding Amount')) row.outstandingAmount = row['Outstanding Amount'];
        if (row.hasOwnProperty('outstandingAmount')) row.outstandingAmount = row.outstandingAmount;
        if (row.hasOwnProperty('Entry Date')) row.entryDate = row['Entry Date'];
        if (row.hasOwnProperty('entryDate')) row.entryDate = row.entryDate;
        if (row.hasOwnProperty('Application No')) row.applicationNo = row['Application No'];
        if (row.hasOwnProperty('applicationNo')) row.applicationNo = row.applicationNo;
        if (row.hasOwnProperty('Month')) row.month = row.Month;
        if (row.hasOwnProperty('MONTH')) row.month = row.MONTH;
        if (row.hasOwnProperty('EMI')) row.emi = row.EMI;
        if (row.hasOwnProperty('Emi')) row.emi = row.Emi;
        if (row.hasOwnProperty('Disbursed Date')) row.disbursedDate = row['Disbursed Date'];
        if (row.hasOwnProperty('disbursed_date')) row.disbursedDate = row.disbursed_date;
        
        // Set default values for optional fields
        if (!row.outstandingAmount && row.amount) {
            row.outstandingAmount = row.amount;
        }
        if (!row.entryDate) {
            row.entryDate = new Date().toISOString().split('T')[0];
        }
        
        // Convert disbursed date format from YYYY-MM-DD to DD-MM-YYYY
        if (row.disbursedDate) {
            row.disbursedDate = convertDateFormat(row.disbursedDate);
        }
        
        // Convert entry date format if needed
        if (row.entryDate) {
            row.entryDate = convertDateFormat(row.entryDate);
        }
    });
}

/**
 * Validate voucher data structure
 * @param {Array} data - Data to validate
 */
function validateVoucherData(data) {
    if (data.length === 0) return;
    
    const firstRow = data[0];
    const hasId = firstRow.hasOwnProperty('id') || firstRow.hasOwnProperty('ID') || firstRow.hasOwnProperty('Voucher No');
    const hasEmpId = firstRow.hasOwnProperty('empId') || firstRow.hasOwnProperty('Employee ID') || firstRow.hasOwnProperty('employeeId');
    const hasEmpName = firstRow.hasOwnProperty('empName') || firstRow.hasOwnProperty('Employee Name') || firstRow.hasOwnProperty('employeeName');
    const hasDate = firstRow.hasOwnProperty('date') || firstRow.hasOwnProperty('Date') || firstRow.hasOwnProperty('Voucher Date');
    const hasAmount = firstRow.hasOwnProperty('amount') || firstRow.hasOwnProperty('Amount');
    const hasMonth = firstRow.hasOwnProperty('month') || firstRow.hasOwnProperty('Month') || firstRow.hasOwnProperty('MONTH');
    
    if (!hasId) {
        throw new Error('Excel file must contain an "id" or "Voucher No" column.');
    }
    if (!hasEmpId) {
        throw new Error('Excel file must contain an "empId" or "Employee ID" column.');
    }
    if (!hasEmpName) {
        throw new Error('Excel file must contain an "empName" or "Employee Name" column.');
    }
    if (!hasDate) {
        throw new Error('Excel file must contain a "date" or "Voucher Date" column.');
    }
    if (!hasAmount) {
        throw new Error('Excel file must contain an "amount" column.');
    }
    if (!hasMonth) {
        throw new Error('Excel file must contain a "month" column.');
    }
    
    // Normalize column names for consistency
    data.forEach(row => {
        if (row.hasOwnProperty('ID')) row.id = row.ID;
        if (row.hasOwnProperty('Voucher No')) row.id = row['Voucher No'];
        if (row.hasOwnProperty('Employee ID')) row.empId = row['Employee ID'];
        if (row.hasOwnProperty('employeeId')) row.empId = row.employeeId;
        if (row.hasOwnProperty('Employee Name')) row.empName = row['Employee Name'];
        if (row.hasOwnProperty('employeeName')) row.empName = row.employeeName;
        if (row.hasOwnProperty('Application No')) row.applicationNo = row['Application No'];
        if (row.hasOwnProperty('applicationNo')) row.applicationNo = row.applicationNo;
        if (row.hasOwnProperty('Date')) row.date = row.Date;
        if (row.hasOwnProperty('Voucher Date')) row.date = row['Voucher Date'];
        if (row.hasOwnProperty('Amount')) row.amount = row.Amount;
        if (row.hasOwnProperty('Month')) row.month = row.Month;
        if (row.hasOwnProperty('MONTH')) row.month = row.MONTH;
        
        // Convert voucher date format from YYYY-MM-DD to DD-MM-YYYY
        if (row.date) {
            row.date = convertDateFormat(row.date);
        }
    });
}

/**
 * Display preview table
 * @param {Array} data - Data to display
 */
function displayPreview(data) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    let tableHTML = '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // Show first 5 rows for preview
    const previewRows = data.slice(0, 5);
    previewRows.forEach(record => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${record[header] || ''}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    if (data.length > 5) {
        tableHTML += `<tr><td colspan="${headers.length}" style="text-align: center; font-style: italic;">... and ${data.length - 5} more rows</td></tr>`;
    }
    
    tableHTML += '</tbody>';
    
    const previewTable = document.getElementById('previewTable');
    const importPreview = document.getElementById('importPreview');
    if (previewTable) {
        previewTable.innerHTML = tableHTML;
    }
    if (importPreview) {
        importPreview.style.display = 'block';
    }
}

/**
 * Confirm import
 */
function confirmImport() {
    if (!importPreviewData || !currentImportType) return;
    
    // Send all data types to server API for database import
    if (currentImportType === 'employee') {
        importEmployeesToDatabase();
        return;
    } else if (currentImportType === 'borrower') {
        importBorrowersToDatabase();
        return;
    } else if (currentImportType === 'voucher') {
        importVouchersToDatabase();
        return;
    }
    
    // Fallback for any other types (should not happen)
    alert('Import not supported for this data type');
}

/**
 * Import employees to database via API
 */
function importEmployeesToDatabase() {
    if (!importPreviewData || importPreviewData.length === 0) {
        alert('No employee data to import');
        return;
    }
    
    // Prepare employee data
    const employees = importPreviewData.map(employee => ({
        id: employee.id,
        name: employee.name
    }));
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmImportBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Importing...';
    confirmBtn.disabled = true;
    
    // Send to server
    fetch('api.php?action=import_employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ employees: employees })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            showNotification(result.message, 'success');
            
            if (result.data && result.data.errors && result.data.errors.length > 0) {
                console.warn('Import warnings:', result.data.errors);
                // Show detailed error information if needed
                const errorMessage = result.data.errors.slice(0, 5).join('\n');
                if (result.data.errors.length > 5) {
                    errorMessage += `\n... and ${result.data.errors.length - 5} more errors`;
                }
                setTimeout(() => {
                    alert('Some records had issues:\n' + errorMessage);
                }, 1000);
            }
            
            closeModal('importModal');
            
            // Refresh employee table and dashboard stats
            renderEmployeeTable();
            loadDashboardStats();
        } else {
            showNotification(result.message || 'Error importing employees', 'error');
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        showNotification('Network error occurred during import', 'error');
    })
    .finally(() => {
        // Restore button state
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    });
}

/**
 * Import borrowers to database via API
 */
function importBorrowersToDatabase() {
    if (!importPreviewData || importPreviewData.length === 0) {
        alert('No borrower data to import');
        return;
    }
    
    // Prepare borrower data
    const borrowers = importPreviewData.map(borrower => ({
        applicationNo: borrower.applicationNo || '',
        empId: borrower.empId,
        name: borrower.name,
        amount: borrower.advanceAmount || borrower.amount,
        outstandingAmount: borrower.outstandingAmount || borrower.advanceAmount || borrower.amount,
        emi: borrower.emi,
        month: borrower.month,
        disbursedDate: borrower.disbursedDate,
        entryDate: borrower.entryDate || new Date().toISOString().split('T')[0]
    }));
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmImportBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Importing...';
    confirmBtn.disabled = true;
    
    // Send to server
    fetch('api.php?action=import_borrowers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ borrowers: borrowers })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            showNotification(result.message, 'success');
            
            if (result.data && result.data.errors && result.data.errors.length > 0) {
                console.warn('Import warnings:', result.data.errors);
                const errorMessage = result.data.errors.slice(0, 5).join('\n');
                if (result.data.errors.length > 5) {
                    errorMessage += `\n... and ${result.data.errors.length - 5} more errors`;
                }
                setTimeout(() => {
                    alert('Some records had issues:\n' + errorMessage);
                }, 1000);
            }
            
            closeModal('importModal');
            
            // Refresh borrower table and dashboard stats
            renderBorrowerTable();
            loadDashboardStats();
        } else {
            showNotification(result.message || 'Error importing borrowers', 'error');
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        showNotification('Network error occurred during import', 'error');
    })
    .finally(() => {
        // Restore button state
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    });
}

/**
 * Import vouchers to database via API
 */
function importVouchersToDatabase() {
    if (!importPreviewData || importPreviewData.length === 0) {
        alert('No voucher data to import');
        return;
    }
    
    // Prepare voucher data
    const vouchers = importPreviewData.map(voucher => ({
        id: voucher.id,
        empId: voucher.empId,
        empName: voucher.empName,
        date: voucher.date,
        amount: voucher.amount,
        month: voucher.month
    }));
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmImportBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Importing...';
    confirmBtn.disabled = true;
    
    // Send to server
    fetch('api.php?action=import_vouchers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ vouchers: vouchers })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            showNotification(result.message, 'success');
            
            if (result.data && result.data.errors && result.data.errors.length > 0) {
                console.warn('Import warnings:', result.data.errors);
                const errorMessage = result.data.errors.slice(0, 5).join('\n');
                if (result.data.errors.length > 5) {
                    errorMessage += `\n... and ${result.data.errors.length - 5} more errors`;
                }
                setTimeout(() => {
                    alert('Some records had issues:\n' + errorMessage);
                }, 1000);
            }
            
            closeModal('importModal');
            
            // Refresh voucher table and dashboard stats
            renderVoucherTable();
            loadDashboardStats();
        } else {
            showNotification(result.message || 'Error importing vouchers', 'error');
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        showNotification('Network error occurred during import', 'error');
    })
    .finally(() => {
        // Restore button state
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    });
}

// ========================================
// Utility Functions
// ========================================

/**
 * Show notification
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (info, success, error, warning)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after specified duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}

// ========================================
// Event Listeners & DOM Ready
// ========================================

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Form submission handlers
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const type = this.getAttribute('data-type');
            const id = this.getAttribute('data-id');
            const formData = new FormData(this);
            
            // Send data to API
            fetch(`api.php?action=update_${type}`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(responseText => {
                if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
                    throw new Error('Server returned invalid JSON response');
                }
                return JSON.parse(responseText);
            })
            .then(result => {
                if (result.success) {
                    // Update local data by merging with existing record
                    const formRecord = {};
                    for (let [key, value] of formData.entries()) {
                        formRecord[key] = isNaN(value) ? value : Number(value);
                    }
                    
                    // For all record types, use the id as the key (which is the correct database ID)
                    let recordKey = id;
                    
                    // Merge form data with existing record to preserve all fields
                    if (data[type + 's'][recordKey]) {
                        data[type + 's'][recordKey] = {
                            ...data[type + 's'][recordKey],
                            ...formRecord
                        };
                    } else {
                        data[type + 's'][recordKey] = formRecord;
                    }
                    
                    // Refresh the table
                    showNotification('Record updated successfully!', 'success');
                    closeModal('editModal');
                    
                    // For borrowers, reload data to get updated calculated fields
                    if (type === 'borrower') {
                        loadDataFromAPI('borrowers').then(() => {
                            renderBorrowerTable();
                            loadDashboardStats();
                        });
                    } else {
                        // Refresh the appropriate table
                        if (type === 'employee') {
                            renderEmployeeTable();
                        } else if (type === 'voucher') {
                            renderVoucherTable();
                        }
                        
                        // Refresh dashboard stats
                        loadDashboardStats();
                    }
                } else {
                    showNotification(result.message || 'Error updating record', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (error.message.includes('JSON')) {
                    showNotification('Server error: Invalid response format', 'error');
                } else {
                    showNotification('Network error occurred', 'error');
                }
            });
        });
    }

    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const type = this.getAttribute('data-type');
            const formData = new FormData(this);
            
            // Send data to API
            try {
                const response = await fetch(`api.php?action=add_${type}`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const responseText = await response.text();
                
                if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
                    throw new Error('Server returned invalid JSON response');
                }
                
                const result = JSON.parse(responseText);
                
                if (result.success) {
                    // Update local data
                    const record = result.data;
                    
                    // For borrowers, use empId as the key instead of generating a separate ID
                    // For vouchers, use auto_id as the key to allow duplicate voucher numbers
                    let recordKey;
                    if (type === 'borrower') {
                        recordKey = record.empId;
                    } else if (type === 'voucher') {
                        recordKey = record.auto_id;
                    } else {
                        recordKey = record.id;
                    }
                    
                    data[type + 's'][recordKey] = record;
                    
                    // Handle borrower amount reduction for vouchers
                    if (type === 'voucher' && record.borrowerUpdate) {
                        const empId = record.empId;
                        const borrowerUpdate = record.borrowerUpdate;
                        
                        // Update borrower data if it exists
                        if (data.borrowers && data.borrowers[empId]) {
                            // Keep original advance amount, update only outstanding amount
                            data.borrowers[empId].outstandingAmount = borrowerUpdate.newOutstanding;
                            data.borrowers[empId].status = borrowerUpdate.status;
                            
                            // If borrower is completed, remove from active borrowers
                            if (borrowerUpdate.status === 'completed') {
                                delete data.borrowers[empId];
                            }
                        }
                        
                        // Reload borrower data from API to ensure accuracy
                        await loadDataFromAPI('borrowers');
                        
                        // Show appropriate notification
                        if (borrowerUpdate.status === 'completed') {
                            showNotification(`🎉 Voucher added successfully! Employee ${record.empName}'s loan has been fully paid off!`, 'success', 5000);
                        } else {
                            showNotification(`Voucher added successfully! Reduced borrower amount by ₹${(borrowerUpdate.reducedBy || 0).toLocaleString()}`, 'success');
                        }
                    } else {
                        showNotification('Record created successfully!', 'success');
                    }
                    
                    closeModal('addModal');
                    
                    // Refresh the appropriate table
                    if (type === 'employee') {
                        renderEmployeeTable();
                    } else if (type === 'borrower') {
                        renderBorrowerTable();
                    } else if (type === 'voucher') {
                        renderVoucherTable();
                        // Always refresh borrower table after voucher addition
                        renderBorrowerTable();
                    }
                    
                    // Refresh dashboard stats
                    await loadDashboardStats();
                } else {
                    showNotification(result.message || 'Error creating record', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.message.includes('JSON')) {
                    showNotification('Server error: Invalid response format', 'error');
                } else {
                    showNotification('Network error occurred', 'error');
                }
            }
        });
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (currentDeleteType && currentDeleteId) {
                // Create form data for delete request
                const formData = new FormData();
                if (currentDeleteType === 'employee') {
                    formData.append('id', currentDeleteId);
                } else if (currentDeleteType === 'borrower') {
                    formData.append('id', currentDeleteId); // Changed from empId to id
                } else if (currentDeleteType === 'voucher') {
                    formData.append('auto_id', currentDeleteId);
                }
                
                // Send delete request to API
                fetch(`api.php?action=delete_${currentDeleteType}`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(responseText => {
                    if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
                        throw new Error('Server returned invalid JSON response');
                    }
                    return JSON.parse(responseText);
                })
                .then(result => {
                    if (result.success) {
                        // Remove from local data
                        delete data[currentDeleteType + 's'][currentDeleteId];
                        showNotification('Record deleted successfully!', 'success');
                        closeModal('deleteModal');
                        
                        // Refresh the appropriate table
                        if (currentDeleteType === 'employee') {
                            renderEmployeeTable();
                        } else if (currentDeleteType === 'borrower') {
                            renderBorrowerTable();
                        } else if (currentDeleteType === 'voucher') {
                            renderVoucherTable();
                        }
                        
                        // Refresh dashboard stats
                        loadDashboardStats();
                    } else {
                        showNotification(result.message || 'Error deleting record', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (error.message.includes('JSON')) {
                        showNotification('Server error: Invalid response format', 'error');
                    } else {
                        showNotification('Network error occurred', 'error');
                    }
                });
            }
        });
    }

    // Navigation event handlers
    document.querySelectorAll('.menu-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            this.parentElement.classList.add('active');
            
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            
            // Close mobile menu if open
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            const toggle = document.querySelector('.mobile-menu-toggle');
            
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                if (overlay) overlay.classList.remove('active');
                if (toggle) toggle.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // File input handler for Excel import
    const excelFileInput = document.getElementById('excelFileInput');
    if (excelFileInput) {
        excelFileInput.addEventListener('change', handleFileSelect);
    }

    // Handle window resize for mobile menu
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        // Close mobile menu on desktop view
        if (window.innerWidth > 768) {
            if (sidebar) sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            if (toggle) toggle.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Initialize dashboard - always show dashboard section by default
    // Clear any existing hash first
    if (window.location.hash) {
        console.log('Clearing existing hash:', window.location.hash);
        history.replaceState(null, null, window.location.pathname);
    }
    
    const hash = window.location.hash.substring(1); // Remove the # symbol
    console.log('Current hash after clear:', hash);
    
    // Always default to dashboard section on page load/refresh
    showSection('dashboard');
    
    // Update active menu item to dashboard
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const dashboardMenuItem = document.querySelector('.menu-item a[href="#dashboard"]');
    if (dashboardMenuItem) {
        dashboardMenuItem.parentElement.classList.add('active');
        console.log('Set dashboard menu item as active');
    }
    
    // Initialize data from database
    initializeData();
    
    // Initialize failed data status
    updateFailedDataStatus();
    
    // Add additional window load event to ensure dashboard is always shown
    window.addEventListener('load', function() {
        console.log('Window fully loaded, ensuring dashboard section is active');
        setTimeout(() => {
            showSection('dashboard');
            
            // Ensure dashboard menu is active
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            const dashboardMenuItem = document.querySelector('.menu-item a[href="#dashboard"]');
            if (dashboardMenuItem) {
                dashboardMenuItem.parentElement.classList.add('active');
            }
        }, 100);
    });
    
    // Add search functionality for employees
    const employeeSearchInput = document.querySelector('#employees-content .search-input');
    if (employeeSearchInput) {
        employeeSearchInput.addEventListener('input', function() {
            filterEmployeeTable(this.value);
        });
    }
});

/**
 * Filter employee table based on search term
 * @param {string} searchTerm - The search term to filter by
 */
function filterEmployeeTable(searchTerm) {
    const employees = data.employees;
    const tbody = document.querySelector('#employees-content .requests-table tbody');
    
    if (!tbody) return;
    
    const filteredEmployees = Object.values(employees).filter(employee => 
        employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">No employees found matching your search.</td></tr>';
        return;
    }
    
    let html = '';
    filteredEmployees.forEach(employee => {
        html += `
            <tr>
                <td>${employee.id}</td>
                <td>${employee.name}</td>
                <td>
                    <button class="view-btn" onclick="viewRecord('employee', '${employee.id}')">View</button>
                    <button class="edit-btn" onclick="editRecord('employee', '${employee.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteRecord('employee', '${employee.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}
