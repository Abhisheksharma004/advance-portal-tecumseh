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
let currentDeleteEmpId = null;
let currentImportType = null;
let importPreviewData = null;

// Reusable Table Action Button Icons
const ICON_EYE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const ICON_EDIT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const ICON_DELETE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
const ICON_DOWNLOAD = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

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
        // Excel date handling with correction for Excel's leap year bug
        const excelBaseDate = new Date(1899, 11, 30); // Dec 30, 1899 (corrected base)
        const date = new Date(excelBaseDate.getTime() + dateString * 24 * 60 * 60 * 1000);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    // Convert to string if not already
    const dateStr = String(dateString).trim();
    
    // Return empty string if date is null, undefined, or empty
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
        return '';
    }
    
    // Check if date is already in DD-MM-YYYY or DD/MM/YYYY format
    if (dateStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
        // Already in DD-MM-YYYY or DD/MM/YYYY format, just normalize separators
        const parts = dateStr.split(/[-\/]/);
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${day}-${month}-${year}`;
    }
    
    // Convert from YYYY-MM-DD to DD-MM-YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    }
    
    // Convert from YYYY/MM/DD to DD-MM-YYYY
    if (dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        const [year, month, day] = dateStr.split('/');
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    
    // Try to parse as Date and format (avoiding timezone issues)
    try {
        // For string dates, try to parse them carefully
        let date;
        
        // Handle MM/DD/YYYY format
        if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [month, day, year] = dateStr.split('/');
            date = new Date(year, month - 1, day); // month is 0-indexed
        } else {
            date = new Date(dateStr);
        }
        
        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        }
    } catch (e) {
        console.warn('Could not parse date:', dateStr, e);
    }
    
    // If all else fails, return the original string
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

/**
 * Generate unique voucher ID
 * @returns {Promise<string>} - Unique voucher ID in format VCH-YYYYMMDD-XXX
 */
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
            initializeSearchForSection('employees');
        } else if (sectionId === 'borrowers') {
            renderBorrowerTable();
            console.log('Borrowers section shown, checking search input...');
            setTimeout(() => {
                const searchInput = document.querySelector('#borrowers-content .search-input');
                console.log('Borrowers search input found:', !!searchInput);
                if (searchInput) {
                    console.log('Search input element:', searchInput);
                }
            }, 50);
            initializeSearchForSection('borrowers');
        } else if (sectionId === 'vouchers') {
            renderVoucherTable();
            initializeSearchForSection('vouchers');
        } else if (sectionId === 'transactions') {
            loadTransactionHistory();
        } else if (sectionId === 'reports') {
            updateReportsTable();
        }
    }
}

/**
 * Initialize search functionality for a specific section
 * @param {string} sectionType - The section type (employees, borrowers, vouchers)
 */
function initializeSearchForSection(sectionType) {
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
        const searchInput = document.querySelector(`#${sectionType}-content .search-input`);
        console.log(`Looking for search input in ${sectionType}-content:`, searchInput);
        
        if (searchInput) {
            // Clear any existing value
            searchInput.value = '';
            
            // Remove any existing event listeners to prevent duplicates
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            
            // Add the event listener
            newSearchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value;
                console.log(`Search triggered for ${sectionType} with term:`, searchTerm);
                
                if (sectionType === 'employees') {
                    filterEmployeeTable(searchTerm);
                } else if (sectionType === 'borrowers') {
                    filterBorrowerTable(searchTerm);
                } else if (sectionType === 'vouchers') {
                    filterVoucherTable(searchTerm);
                }
            });
            
            // Also add keyup event as backup
            newSearchInput.addEventListener('keyup', function(e) {
                const searchTerm = e.target.value;
                if (sectionType === 'borrowers') {
                    filterBorrowerTable(searchTerm);
                }
            });
            
            console.log(`Search functionality initialized for ${sectionType}`);
        } else {
            console.error(`Search input not found for ${sectionType}`);
        }
    }, 100);
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
                <td class="emp-id-cell">${employee.id}</td>
                <td>${employee.name}</td>
                <td>${entryDate}</td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewRecord('employee', '${employee.id}')" title="View">${ICON_EYE}</button>
                    <button class="edit-btn action-btn-icon" onclick="editRecord('employee', '${employee.id}')" title="Edit">${ICON_EDIT}</button>
                    <button class="delete-btn action-btn-icon" onclick="deleteRecord('employee', '${employee.id}')" title="Delete">${ICON_DELETE}</button>
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
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No borrowers found. Click "Add New Borrower" to get started.</td></tr>';
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
        
        // Determine status display and styling
        const isCompleted = borrower.status === 'completed' || (borrower.outstandingAmount && borrower.outstandingAmount <= 0);
        const statusClass = isCompleted ? 'status-completed' : 'status-active';
        const statusText = isCompleted ? 'Completed' : 'Active';
        const rowClass = isCompleted ? 'completed-row' : '';
        
        // Determine if edit/delete should be disabled for completed records
        const editDisabled = isCompleted ? 'disabled' : '';
        const deleteDisabled = isCompleted ? 'disabled' : '';
        
        html += `
            <tr class="${rowClass}">
                <td class="emp-id-cell">${borrower.empId}</td>
                <td>${borrower.name}</td>
                <td>₹${(borrower.amount || 0).toLocaleString()}</td>
                <td>₹${(borrower.outstandingAmount || borrower.amount || 0).toLocaleString()}</td>
                <td>₹${(borrower.emi || 0).toLocaleString()}</td>
                <td>${borrower.month || 'N/A'}</td>
                <td>${convertDateFormat(borrower.disbursedDate)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewRecord('borrower', '${borrower.empId}')" title="View History">${ICON_EYE}</button>
                    <button class="edit-btn action-btn-icon ${editDisabled}" onclick="editRecord('borrower', '${borrower.id}')" ${editDisabled ? 'disabled title="Cannot edit completed records"' : 'title="Edit"'}>${ICON_EDIT}</button>
                    <button class="delete-btn action-btn-icon ${deleteDisabled}" onclick="deleteRecord('borrower', '${borrower.id}')" ${deleteDisabled ? 'disabled title="Cannot delete completed records"' : 'title="Delete"'}>${ICON_DELETE}</button>
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
                <td class="emp-id-cell">${employee.empId}</td>
                <td>${employee.empName}</td>
                <td><span class="voucher-count">${employee.vouchers.length}</span></td>
                <td><span class="amount-total">₹${(employee.totalAmount || 0).toLocaleString()}</span></td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewEmployeeVouchers('${employee.empId}')" title="View Vouchers">${ICON_EYE}</button>
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
    console.log('viewEmployeeVouchers called with empId:', empId);
    console.log('data object:', data);
    
    const vouchers = data.vouchers;
    const employeeVouchers = Object.values(vouchers).filter(voucher => voucher.empId === empId);
    
    console.log('Found vouchers:', employeeVouchers);
    
    if (employeeVouchers.length === 0) {
        alert('No vouchers found for this employee');
        closeModal('viewModal');
        return;
    }
    
    const employee = employeeVouchers[0]; // Get employee details from first voucher
    let totalAmount = 0; // Initialize totalAmount at the top
    
    let vouchersList = `
        <div class="table-container">
            <table class="requests-table vouchers-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Voucher No</th>
                        <th>Application No</th>
                        <th>Date</th>
                        <th>Month</th>
                        <th style="text-align: right;">Amount</th>
                        <th style="text-align: center;">Action</th>
                    </tr>
                </thead>
                <tbody>`;
    
    employeeVouchers.forEach((voucher, index) => {
        totalAmount += parseFloat(voucher.amount);
        vouchersList += `
                    <tr>
                        <td style="color: #64748b;">${index + 1}</td>
                        <td style="font-weight: 600; color: #2563eb;">${voucher.id}</td>
                        <td style="color: #475569;">${voucher.applicationNo || 'N/A'}</td>
                        <td>${convertDateFormat(voucher.date)}</td>
                        <td>${voucher.month}</td>
                        <td style="color: #059669; font-weight: 600; text-align: right;">₹${parseFloat(voucher.amount).toLocaleString()}</td>
                        <td style="text-align: center;">
                            <button class="delete-btn action-btn-icon" onclick="deleteRecord('voucher', '${voucher.auto_id || voucher.id}', '${employee.empId}')" title="Delete Voucher">${ICON_DELETE}</button>
                        </td>
                    </tr>`;
    });
    
    vouchersList += `
                </tbody>
                <tfoot>
                    <tr style="background: #f8fafc; font-weight: 600; border-top: 2px solid #e2e8f0;">
                        <td colspan="5" style="text-align: right; padding: 12px 16px;">Total Amount:</td>
                        <td style="color: #059669; font-weight: 700; font-size: 1rem; text-align: right; padding: 12px 16px;">₹${totalAmount.toLocaleString()}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    
    const content = `
        <div class="employee-vouchers-details">
            <div class="modal-info-bar">
                <div class="modal-info-item">
                    <span class="modal-info-label">Employee ID</span>
                    <span class="modal-info-value">${employee.empId}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Employee Name</span>
                    <span class="modal-info-value">${employee.empName}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Total Vouchers</span>
                    <span class="modal-info-value">${employeeVouchers.length}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Total Amount</span>
                    <span class="modal-info-value" style="color: #059669;">₹${(totalAmount || 0).toLocaleString()}</span>
                </div>
            </div>
            
            <div class="vouchers-list">
                ${vouchersList}
            </div>
        </div>
    `;

    const viewModalBody = document.getElementById('viewModalBody');
    if (viewModalBody) {
        viewModalBody.innerHTML = content;
        const titleEl = document.querySelector('#viewModal .modal-header h2');
        if (titleEl) {
            titleEl.textContent = 'Employee Vouchers';
        }
        const modalContent = document.querySelector('#viewModal .modal-content');
        if (modalContent) modalContent.classList.add('modal-wide');
        openModal('viewModal');
    } else {
        console.error('viewModalBody element not found!');
        alert('Modal element not found. Please refresh the page.');
    }
}

// ========================================
// Transaction History Functions
// ========================================

/**
 * Load and display transaction history
 */
async function loadTransactionHistory() {
    try {
        const filters = getTransactionFilters();
        const queryParams = new URLSearchParams(filters);
        
        const response = await fetch(`api.php?action=get_transaction_history&${queryParams}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            updateTransactionStats(data.summary);
            renderTransactionTable(data.transactions);
        } else {
            console.error('Transaction history error:', result.message);
            showNotification(`Error loading transaction history: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error loading transaction history:', error);
        showNotification(`Error loading transaction history: ${error.message}`, 'error');
    }
}

/**
 * Get current filter values
 */
function getTransactionFilters() {
    const filters = {};
    
    const employeeFilter = document.getElementById('filterEmployee');
    if (employeeFilter && employeeFilter.value.trim()) {
        filters.employee_id = employeeFilter.value.trim();
    }
    
    return filters;
}

/**
 * Update transaction statistics display
 */
function updateTransactionStats(summary) {
    const totalTransactionsEl = document.getElementById('total-transactions');
    const totalAdvancesEl = document.getElementById('total-advances');
    const totalRepaymentsEl = document.getElementById('total-repayments');
    const netOutstandingEl = document.getElementById('net-outstanding');
    
    if (totalTransactionsEl) totalTransactionsEl.textContent = summary.totalTransactions || '0';
    if (totalAdvancesEl) totalAdvancesEl.textContent = `₹${(summary.totalAdvances || 0).toLocaleString()}`;
    if (totalRepaymentsEl) totalRepaymentsEl.textContent = `₹${(summary.totalRepayments || 0).toLocaleString()}`;
    if (netOutstandingEl) netOutstandingEl.textContent = `₹${(summary.currentOutstanding || 0).toLocaleString()}`;
}

/**
 * Render transaction history table
 */
function renderTransactionTable(transactions) {
    const tbody = document.getElementById('transactionHistoryBody');
    
    if (!tbody) return;
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No transactions found</td></tr>';
        return;
    }
    
    let html = '';
    transactions.forEach(transaction => {
        const statusClass = transaction.status.toLowerCase() === 'active' ? 'status-active' : 
                           transaction.status.toLowerCase() === 'completed' ? 'status-completed' : 
                           transaction.status.toLowerCase() === 'pending' ? 'status-pending' : 'status-cancelled';
        
        const typeClass = transaction.transaction_type === 'advance' ? 'transaction-outgoing' : 'transaction-incoming';
        const amountPrefix = transaction.transaction_type === 'advance' ? '-' : '+';
        
        // Display voucher number only for voucher transactions, empty for advances
        const voucherNumber = transaction.voucher_number || '';
        
        html += `
            <tr class="${typeClass}">
                <td data-label="Date">${transaction.date}</td>
                <td data-label="Transaction Type">
                    <span class="transaction-type ${typeClass}">
                        ${transaction.type}
                    </span>
                </td>
                <td data-label="Employee ID">${transaction.emp_id}</td>
                <td data-label="Employee Name">${transaction.emp_name}</td>
                <td data-label="Amount" class="${typeClass}">
                    <span class="amount-display">
                        ${amountPrefix}${transaction.amount_formatted}
                    </span>
                </td>
                <td data-label="Description">${transaction.description}</td>
                <td data-label="Reference">${transaction.reference}</td>
                <td data-label="Voucher Number" class="voucher-number">${voucherNumber}</td>
                <td data-label="Status">
                    <span class="status-badge ${statusClass}">
                        ${transaction.status}
                    </span>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Show/hide transaction filters
 */
function showTransactionFilters() {
    const filtersDiv = document.getElementById('transactionFilters');
    if (filtersDiv) {
        filtersDiv.style.display = filtersDiv.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Apply transaction filters
 */
function applyTransactionFilters() {
    loadTransactionHistory();
}

/**
 * Clear all transaction filters
 */
function clearTransactionFilters() {
    document.getElementById('filterEmployee').value = '';
    loadTransactionHistory();
}

/**
 * Sort transactions by column
 */
function sortTransactions(column) {
    // Implementation for sorting transactions
    console.log('Sorting transactions by:', column);
    // This would be implemented to sort the transaction table
}

/**
 * View detailed information about a specific transaction
 */
function viewTransactionDetails(type, reference, empId) {
    console.log('Viewing transaction details:', type, reference, empId);
    
    let content = '';
    
    if (type === 'advance') {
        // Find the borrower record
        const borrower = Object.values(data.borrowers || {}).find(b => 
            b.applicationNo === reference || b.empId === empId
        );
        
        if (borrower) {
            content = `
                <div class="transaction-details">
                    <h3>Advance Transaction Details</h3>
                    <div class="detail-row"><strong>Transaction Type:</strong> Loan Payment</div>
                    <div class="detail-row"><strong>Application No:</strong> ${borrower.applicationNo || 'N/A'}</div>
                    <div class="detail-row"><strong>Employee ID:</strong> ${borrower.empId}</div>
                    <div class="detail-row"><strong>Employee Name:</strong> ${borrower.name}</div>
                    <div class="detail-row"><strong>Amount:</strong> ₹${(borrower.amount || 0).toLocaleString()}</div>
                    <div class="detail-row"><strong>Outstanding:</strong> ₹${(borrower.outstandingAmount || 0).toLocaleString()}</div>
                    <div class="detail-row"><strong>EMI:</strong> ₹${(borrower.emi || 0).toLocaleString()}</div>
                    <div class="detail-row"><strong>Months:</strong> ${borrower.months || 'N/A'}</div>
                    <div class="detail-row"><strong>Disbursed Date:</strong> ${borrower.disbursedDate}</div>
                    <div class="detail-row"><strong>Status:</strong> ${borrower.status}</div>
                </div>
            `;
        }
    } else if (type === 'repayment') {
        // Find the voucher record
        const voucher = Object.values(data.vouchers || {}).find(v => 
            v.id === reference || v.applicationNo === reference
        );
        
        if (voucher) {
            content = `
                <div class="transaction-details">
                    <h3>Repayment Transaction Details</h3>
                    <div class="detail-row"><strong>Transaction Type:</strong> EMI Payment</div>
                    <div class="detail-row"><strong>Voucher ID:</strong> ${voucher.id}</div>
                    <div class="detail-row"><strong>Application No:</strong> ${voucher.applicationNo || 'N/A'}</div>
                    <div class="detail-row"><strong>Employee ID:</strong> ${voucher.empId}</div>
                    <div class="detail-row"><strong>Employee Name:</strong> ${voucher.empName}</div>
                    <div class="detail-row"><strong>Amount:</strong> ₹${(voucher.amount || 0).toLocaleString()}</div>
                    <div class="detail-row"><strong>Date:</strong> ${voucher.date}</div>
                    <div class="detail-row"><strong>Month:</strong> ${voucher.month}</div>
                </div>
            `;
        }
    }
    
    if (content) {
        document.getElementById('viewModalBody').innerHTML = content;
        openModal('viewModal');
    } else {
        showNotification('Transaction details not found', 'error');
    }
}

/**
 * Export transaction history to Excel
 */
async function exportTransactionHistory() {
    try {
        const filters = getTransactionFilters();
        filters.limit = 10000;
        filters.offset = 0;
        const queryParams = new URLSearchParams(filters);
        
        showNotification('Generating transaction history export...', 'info');
        
        const response = await fetch(`api.php?action=get_transaction_history&${queryParams}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.transactions) {
            const transactions = result.data.transactions;
            
            if (transactions.length === 0) {
                showNotification('No transactions found to export', 'warning');
                return;
            }
            
            const exportData = transactions.map((t, index) => ({
                'No': index + 1,
                'Date': convertDateFormat(t.date || t.transaction_date),
                'Transaction Type': t.type || (t.transaction_type === 'advance' ? 'Loan Payment' : 'EMI Payment'),
                'Employee ID': t.emp_id || t.empId,
                'Employee Name': t.emp_name || t.empName,
                'Amount (₹)': parseFloat(t.amount || 0),
                'Description': t.description || '',
                'Voucher / Reference': t.voucher_number || t.reference || 'N/A',
                'Status': t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : '',
                'Created At': t.created_at || ''
            }));
            
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction History');
            
            const filename = `Transaction_History_${new Date().toISOString().split('T')[0]}.xlsx`;
            downloadExcel(workbook, filename);
        } else {
            showNotification(result.message || 'Error exporting transaction history', 'error');
        }
    } catch (error) {
        console.error('Error exporting transaction history:', error);
        showNotification('Error exporting transaction history: ' + error.message, 'error');
    }
}

/**
 * Refresh transaction history data
 */
function refreshTransactionHistory() {
    showNotification('Refreshing transaction history...', 'info');
    loadTransactionHistory();
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
        // Ensure we have a valid date
        let borrowerDate = borrower.disbursedDate || borrower.disbursed_date || new Date().toISOString().split('T')[0];
        
        activities.push({
            date: borrowerDate,
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
        // Ensure we have a valid date
        let voucherDate = voucher.date || voucher.voucher_date || new Date().toISOString().split('T')[0];
        
        activities.push({
            date: voucherDate,
            applicationNo: voucher.applicationNo || 'N/A',
            employee: voucher.empName,
            amount: `₹${voucher.amount}`,
            type: 'Voucher',
            empId: voucher.empId,
            id: voucher.id
        });
    });    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No recent activity found. Start by adding employees, borrowers, or vouchers.</td></tr>';
        return;
    }
    
    let html = '';
    activities.slice(0, 10).forEach(activity => { // Show only 10 recent activities
        const formattedDate = convertDateFormat(activity.date);
        
        html += `
            <tr>
                <td>${formattedDate}</td>
                <td>${activity.applicationNo}</td>
                <td>${activity.employee}</td>
                <td>${activity.amount}</td>
                <td>${activity.type}</td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewActivityDetails('${activity.type}', '${activity.id}', '${activity.empId}')" title="View Details">${ICON_EYE}</button>
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
                    <button class="view-btn action-btn-icon" onclick="previewReport('${report.action}')" ${report.count === 0 ? 'disabled' : ''} title="Preview Report">${ICON_EYE}</button>
                    <button class="export-btn action-btn-icon" onclick="generateReport('${report.action}')" ${report.count === 0 ? 'disabled' : ''} title="Export Report">${ICON_DOWNLOAD}</button>
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
                    <button class="view-btn action-btn-icon" onclick="viewFailedDataDetails('${item.id}', '${type}')" title="View Details">${ICON_EYE}</button>
                    <button class="delete-btn action-btn-icon" onclick="removeFailedData('${item.id}', '${type}')" title="Remove">${ICON_DELETE}</button>
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
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        // Force display with important properties
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = modalId === 'deleteModal' ? '10005' : '9999';
        
        document.body.style.overflow = 'hidden';
        
        // Ensure modal content is properly displayed
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.display = 'flex';
            modalContent.style.flexDirection = 'column';
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
        modal.style.display = 'none';
        
        // Remove modal-wide class if present
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('modal-wide');
        }
        
        // Only restore body overflow if no other modal is currently visible
        const anyModalOpen = Array.from(document.querySelectorAll('.modal')).some(m => m.style.display === 'block' && m.id !== modalId);
        if (!anyModalOpen) {
            document.body.style.overflow = 'auto';
        }
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
            const empStatus = (historyData.employee.status || 'active').toLowerCase();
            const empStatusClass = empStatus === 'active' ? 'status-active' : 'status-cancelled';
            let content = `
                <div class="borrower-history">
                    <div class="modal-info-bar">
                        <div class="modal-info-item">
                            <span class="modal-info-label">Employee ID</span>
                            <span class="modal-info-value">${historyData.employee.id}</span>
                        </div>
                        <div class="modal-info-item">
                            <span class="modal-info-label">Employee Name</span>
                            <span class="modal-info-value">${historyData.employee.name}</span>
                        </div>
                        <div class="modal-info-item">
                            <span class="modal-info-label">Status</span>
                            <span class="status-badge ${empStatusClass}">${historyData.employee.status}</span>
                        </div>
                    </div>
                    
                    <div class="borrowing-summary">
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
                                <div class="summary-value text-success">₹${parseFloat(historyData.summary.totalOutstanding || 0).toLocaleString()}</div>
                                <div class="summary-label">Outstanding</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="borrowing-history-section">
                        <h3 class="history-section-title">Borrowing History</h3>
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
                content += '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No borrowing history found</td></tr>';
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
                            <td style="font-weight: 600; color: #2563eb;">${record.applicationNo || 'N/A'}</td>
                            <td>₹${parseFloat(record.amount || 0).toLocaleString()}</td>
                            <td style="font-weight: 600; color: #059669;">₹${parseFloat(record.outstandingAmount || 0).toLocaleString()}</td>
                            <td>₹${parseFloat(record.emi || 0).toLocaleString()}</td>
                            <td>${record.months || 'N/A'}</td>
                            <td>${record.disbursedDate}</td>
                            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
                            <td style="color: #64748b;">${createdDate}</td>
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
                const modalContent = document.querySelector('#viewModal .modal-content');
                if (modalContent) modalContent.classList.add('modal-wide');
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
                    <input type="text" name="id" id="voucher-id" required placeholder="Enter voucher number ">
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
            setTimeout(async () => {
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
 * @param {string} [empId] - Optional employee ID for voucher context
 */
function deleteRecord(type, id, empId = null) {
    currentDeleteType = type;
    currentDeleteId = id;
    if (type === 'voucher') {
        if (empId) {
            currentDeleteEmpId = empId;
        } else {
            const v = data.vouchers && (data.vouchers[id] || Object.values(data.vouchers).find(item => item.auto_id == id || item.id == id));
            currentDeleteEmpId = v ? v.empId : null;
        }
        const deleteMsg = document.querySelector('#deleteModal .modal-body p');
        if (deleteMsg) {
            deleteMsg.textContent = 'Are you sure you want to delete this voucher? This action cannot be undone.';
        }
    } else {
        currentDeleteEmpId = null;
        const deleteMsg = document.querySelector('#deleteModal .modal-body p');
        if (deleteMsg) {
            deleteMsg.textContent = 'Are you sure you want to delete this record? This action cannot be undone.';
        }
    }
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
            entryDate: record.created_at || record.entryDate || new Date().toISOString().split('T')[0],
            status: record.status || 'active'
        }));
    } else if (type === 'employee') {
        // Ensure employee data follows the correct field order
        orderedData = Object.values(records).map(record => ({
            id: record.id,
            name: record.name
        }));
    } else if (type === 'voucher') {
        // Ensure voucher data follows the Create New Voucher form field order
        orderedData = Object.values(records).map(record => ({
            'Voucher No': record.id,
            'Employee ID': record.empId,
            'Employee Name': record.empName,
            'Application Number': record.applicationNo || '',
            'Voucher Date': record.date,
            'Amount': record.amount,
            'Month': record.month
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
            entryDate: record.created_at || record.entryDate || new Date().toISOString().split('T')[0],
            status: record.status || 'active'
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
                disbursedDate: '01-08-2025',
                status: 'active'
            }];
            break;
        case 'voucher':
            const today = new Date();
            const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
            
            // Template matching Create New Voucher form field order and names
            templateData = [{
                'Voucher No': 'VCH-001',
                'Employee ID': 'EMP001', 
                'Employee Name': 'John Doe',
                'Application Number': 'APP000001',
                'Voucher Date': todayStr,
                'Amount': 1000,
                'Month': 'August'
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
    console.log('Available columns in Excel:', Object.keys(firstRow)); // Debug log
    
    // More flexible column detection with trimming and case-insensitive matching
    const columnKeys = Object.keys(firstRow).map(key => key.trim());
    
    const hasEmpId = columnKeys.some(key => 
        key.toLowerCase().includes('employee') && key.toLowerCase().includes('id') ||
        key.toLowerCase() === 'empid' || key.toLowerCase() === 'employeeid'
    );
    
    const hasEmpName = columnKeys.some(key => 
        key.toLowerCase().includes('employee') && key.toLowerCase().includes('name') ||
        key.toLowerCase() === 'empname' || key.toLowerCase() === 'employeename'
    );
    
    const hasAppNumber = columnKeys.some(key => 
        key.toLowerCase().includes('application') && key.toLowerCase().includes('number') ||
        key.toLowerCase() === 'applicationno' || key.toLowerCase() === 'applicationnumber'
    );
    
    const hasDate = columnKeys.some(key => 
        key.toLowerCase().includes('voucher') && key.toLowerCase().includes('date') ||
        key.toLowerCase() === 'date' || key.toLowerCase() === 'voucherdate'
    );
    
    const hasAmount = columnKeys.some(key => 
        key.toLowerCase() === 'amount'
    );
    
    const hasMonth = columnKeys.some(key => 
        key.toLowerCase() === 'month'
    );
    
    const hasVoucherId = columnKeys.some(key => 
        key.toLowerCase().includes('voucher') && (key.toLowerCase().includes('id') || key.toLowerCase().includes('no')) ||
        key.toLowerCase() === 'id' || key.toLowerCase() === 'voucherid' ||
        key.toLowerCase() === 'voucher id' || key.toLowerCase() === 'voucher_id' ||
        key.toLowerCase() === 'voucher no' || key.toLowerCase() === 'voucherno'
    );
    
    console.log('Column validation results:', {
        hasEmpId, hasEmpName, hasAppNumber, hasDate, hasAmount, hasMonth, hasVoucherId
    }); // Debug log
    
    if (!hasEmpId) {
        throw new Error('Excel file must contain an "Employee ID" column. Found columns: ' + columnKeys.join(', '));
    }
    if (!hasEmpName) {
        throw new Error('Excel file must contain an "Employee Name" column. Found columns: ' + columnKeys.join(', '));
    }
    if (!hasAppNumber) {
        throw new Error('Excel file must contain an "Application Number" column. Found columns: ' + columnKeys.join(', '));
    }
    if (!hasDate) {
        throw new Error('Excel file must contain a "Voucher Date" column. Found columns: ' + columnKeys.join(', '));
    }
    if (!hasAmount) {
        throw new Error('Excel file must contain an "Amount" column. Found columns: ' + columnKeys.join(', '));
    }
    if (!hasMonth) {
        throw new Error('Excel file must contain a "Month" column. Found columns: ' + columnKeys.join(', '));
    }
    if (!hasVoucherId) {
        throw new Error('Excel file must contain a "Voucher Id", "Voucher ID", "Voucher No", or "ID" column. Found columns: ' + columnKeys.join(', '));
    }
    
    // Normalize column names to match the exact preview format
    data.forEach(row => {
        const originalKeys = Object.keys(row);
        
        // Employee ID field - find and normalize
        const empIdKey = originalKeys.find(key => {
            const lowerKey = key.trim().toLowerCase();
            return lowerKey.includes('employee') && lowerKey.includes('id') ||
                   lowerKey === 'empid' || lowerKey === 'employeeid';
        });
        if (empIdKey && !row['Employee ID']) {
            row['Employee ID'] = row[empIdKey];
        }
        
        // Employee Name field - find and normalize
        const empNameKey = originalKeys.find(key => {
            const lowerKey = key.trim().toLowerCase();
            return lowerKey.includes('employee') && lowerKey.includes('name') ||
                   lowerKey === 'empname' || lowerKey === 'employeename';
        });
        if (empNameKey && !row['Employee Name']) {
            row['Employee Name'] = row[empNameKey];
        }
        
        // Application Number field - find and normalize
        const appNumberKey = originalKeys.find(key => {
            const lowerKey = key.trim().toLowerCase();
            return lowerKey.includes('application') && lowerKey.includes('number') ||
                   lowerKey === 'applicationno' || lowerKey === 'applicationnumber';
        });
        if (appNumberKey && !row['Application Number']) {
            row['Application Number'] = row[appNumberKey];
        }
        
        // Voucher Date field - find and normalize
        const dateKey = originalKeys.find(key => {
            const lowerKey = key.trim().toLowerCase();
            return lowerKey.includes('voucher') && lowerKey.includes('date') ||
                   lowerKey === 'date' || lowerKey === 'voucherdate';
        });
        if (dateKey && !row['Voucher Date']) {
            row['Voucher Date'] = row[dateKey];
        }
        
        // Amount field - find and normalize
        const amountKey = originalKeys.find(key => {
            return key.trim().toLowerCase() === 'amount';
        });
        if (amountKey && !row['Amount']) {
            row['Amount'] = row[amountKey];
        }
        
        // Month field - find and normalize
        const monthKey = originalKeys.find(key => {
            return key.trim().toLowerCase() === 'month';
        });
        if (monthKey && !row['Month']) {
            row['Month'] = row[monthKey];
        }
        
        // Voucher Id field - find and normalize
        const voucherIdKey = originalKeys.find(key => {
            const lowerKey = key.trim().toLowerCase();
            return lowerKey.includes('voucher') && (lowerKey.includes('id') || lowerKey.includes('no')) ||
                   lowerKey === 'id' || lowerKey === 'voucherid' ||
                   lowerKey === 'voucher id' || lowerKey === 'voucher_id' ||
                   lowerKey === 'voucher no' || lowerKey === 'voucherno';
        });
        if (voucherIdKey && !row['Voucher Id']) {
            row['Voucher Id'] = row[voucherIdKey];
        }
        
        // Convert voucher date format to DD-MM-YYYY for display
        if (row['Voucher Date']) {
            row['Voucher Date'] = convertDateFormat(row['Voucher Date']);
        }
    });
}

/**
 * Display preview table with enhanced date formatting
 * @param {Array} data - Data to display
 */
function displayPreview(data) {
    if (data.length === 0) return;
    
    // Define exact column order for voucher preview
    let headers;
    let isVoucherData = false;
    
    // Check if this is voucher data by looking for voucher-specific columns
    if (data[0].hasOwnProperty('Employee ID') && data[0].hasOwnProperty('Voucher Date') && 
        (data[0].hasOwnProperty('Voucher Id') || data[0].hasOwnProperty('Voucher ID') || data[0].hasOwnProperty('Voucher No'))) {
        // Use exact column order as specified for voucher data
        headers = ['Employee ID', 'Employee Name', 'Application Number', 'Voucher Date', 'Amount', 'Month', 'Voucher Id'];
        isVoucherData = true;
    } else {
        // For other data types, use existing keys
        headers = Object.keys(data[0]);
    }
    
    let tableHTML = '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // Show first 5 rows for preview
    const previewRows = data.slice(0, 5);
    previewRows.forEach((record, index) => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            let cellValue = record[header] || '';
            
            // Enhanced date formatting for preview (only for Voucher Date)
            if (header === 'Voucher Date' && cellValue) {
                const originalValue = cellValue;
                const formattedValue = convertDateFormat(cellValue);
                
                // Show formatted date with green styling for voucher dates
                cellValue = `<span class="date-formatted" style="color: #28a745; font-weight: bold;">${formattedValue}</span>`;
            }
            
            // Format amount with proper styling
            if (header === 'Amount' && cellValue) {
                cellValue = `<span style="font-weight: bold; color: #007bff;">${cellValue}</span>`;
            }
            
            // Format Employee ID with monospace font
            if (header === 'Employee ID' && cellValue) {
                cellValue = `<span style="font-family: monospace; font-weight: bold;">${cellValue}</span>`;
            }
            
            // Format Voucher Id with monospace font
            if (header === 'Voucher Id' && cellValue) {
                cellValue = `<span style="font-family: monospace; font-weight: bold; color: #6f42c1;">${cellValue}</span>`;
            }
            
            tableHTML += `<td>${cellValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    if (data.length > 5) {
        tableHTML += `<tr><td colspan="${headers.length}" style="text-align: center; font-style: italic; background-color: #f8f9fa; padding: 10px;">
            ... and ${data.length - 5} more rows (total: ${data.length} records)
        </td></tr>`;
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
                let errorMessage = result.data.errors.slice(0, 5).join('\n');
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
            // Handle different types of errors
            const errorMessage = result.message || 'Error importing employees';
            const errorData = result.data || {};
            
            if (errorData.errorType === 'database') {
                let detailedMessage = `❌ Database Error:\n${errorMessage}\n\n`;
                detailedMessage += '💡 Suggestions:\n';
                detailedMessage += '• Check employee ID format and uniqueness\n';
                detailedMessage += '• Ensure employee names are not too long\n';
                detailedMessage += '• Try importing smaller batches';
                
                alert(detailedMessage);
            }
            showNotification(errorMessage, 'error');
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        
        let errorMessage = 'Employee import failed';
        if (error.message.includes('HTTP error') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Connection error during employee import';
        }
        
        showNotification(errorMessage, 'error');
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
                let errorMessage = result.data.errors.slice(0, 5).join('\n');
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
            // Handle different types of errors
            const errorMessage = result.message || 'Error importing borrowers';
            const errorData = result.data || {};
            
            if (errorData.errorType === 'database') {
                let detailedMessage = `❌ Database Error:\n${errorMessage}\n\n`;
                detailedMessage += '💡 Suggestions:\n';
                detailedMessage += '• Check application number uniqueness\n';
                detailedMessage += '• Verify employee IDs exist\n';
                detailedMessage += '• Check amount and date formats\n';
                detailedMessage += '• Try importing smaller batches';
                
                alert(detailedMessage);
            }
            showNotification(errorMessage, 'error');
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        
        let errorMessage = 'Borrower import failed';
        if (error.message.includes('HTTP error') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Connection error during borrower import';
        }
        
        showNotification(errorMessage, 'error');
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
    
    // Prepare voucher data with the new column structure
    const vouchers = importPreviewData.map((voucher) => {
        return {
            id: voucher['Voucher Id'] || voucher['Voucher ID'] || voucher['Voucher No'] || voucher.id, // Handle "Voucher No" as well
            empId: voucher['Employee ID'] || voucher.empId, // Map from "Employee ID" column
            empName: voucher['Employee Name'] || voucher.empName, // Map from "Employee Name" column
            applicationNo: voucher['Application Number'] || voucher.applicationNo || '', // Map from "Application Number" column
            date: voucher['Voucher Date'] || voucher.date, // Map from "Voucher Date" column
            amount: voucher['Amount'] || voucher.amount, // Map from "Amount" column
            month: voucher['Month'] || voucher.month // Map from "Month" column
        };
    });
    
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
            let successMessage = result.message;
            
            // Add borrower update information if available
            if (result.data && result.data.borrowerUpdateCount > 0) {
                successMessage += `\n💰 ${result.data.borrowerUpdateCount} borrower accounts automatically updated with advance repayments!`;
            }
            
            showNotification(successMessage, 'success');
            
            if (result.data && result.data.errors && result.data.errors.length > 0) {
                console.warn('Import warnings (' + result.data.errors.length + '):');
                result.data.errors.forEach((error, index) => {
                    console.warn(`  ${index + 1}. ${error}`);
                });
                
                // Categorize errors for better user understanding
                const employeeErrors = result.data.errors.filter(err => err.includes('not found') && err.includes('Employee'));
                const fieldErrors = result.data.errors.filter(err => err.includes('required'));
                const applicationWarnings = result.data.errors.filter(err => err.includes('Application number') && err.includes('Warning'));
                const validationErrors = result.data.errors.filter(err => 
                    err.includes('too long') || 
                    err.includes('must be greater than') || 
                    err.includes('Invalid date format')
                );
                const otherErrors = result.data.errors.filter(err => 
                    !err.includes('not found') && 
                    !err.includes('required') &&
                    !err.includes('Warning - Application number') &&
                    !err.includes('too long') &&
                    !err.includes('must be greater than') &&
                    !err.includes('Invalid date format')
                );
                
                let errorMessage = '⚠️ Import completed with some issues:\n\n';
                
                if (employeeErrors.length > 0) {
                    errorMessage += `👤 Missing Employees (${employeeErrors.length} errors):\n`;
                    employeeErrors.slice(0, 3).forEach(err => {
                        errorMessage += `  • ${err}\n`;
                    });
                    if (employeeErrors.length > 3) {
                        errorMessage += `  • ... and ${employeeErrors.length - 3} more employee errors\n`;
                    }
                    errorMessage += '💡 Tip: Add missing employees first, then re-import\n\n';
                }
                
                if (fieldErrors.length > 0) {
                    errorMessage += `📝 Missing Required Fields (${fieldErrors.length} errors):\n`;
                    fieldErrors.slice(0, 3).forEach(err => {
                        errorMessage += `  • ${err}\n`;
                    });
                    if (fieldErrors.length > 3) {
                        errorMessage += `  • ... and ${fieldErrors.length - 3} more field errors\n`;
                    }
                    errorMessage += '💡 Tip: Check Excel template for required columns\n\n';
                }
                
                if (applicationWarnings.length > 0) {
                    errorMessage += `💰 Application Number Warnings (${applicationWarnings.length} warnings):\n`;
                    applicationWarnings.slice(0, 3).forEach(err => {
                        errorMessage += `  • ${err}\n`;
                    });
                    if (applicationWarnings.length > 3) {
                        errorMessage += `  • ... and ${applicationWarnings.length - 3} more application warnings\n`;
                    }
                    errorMessage += '💡 Note: These are warnings - vouchers were still imported\n\n';
                }
                
                if (validationErrors.length > 0) {
                    errorMessage += `🔍 Validation Errors (${validationErrors.length} errors):\n`;
                    validationErrors.slice(0, 3).forEach(err => {
                        errorMessage += `  • ${err}\n`;
                    });
                    if (validationErrors.length > 3) {
                        errorMessage += `  • ... and ${validationErrors.length - 3} more validation errors\n`;
                    }
                    errorMessage += '💡 Tip: Check data format and field lengths\n\n';
                }
                
                if (otherErrors.length > 0) {
                    errorMessage += `⚠️ Other Issues (${otherErrors.length} errors):\n`;
                    otherErrors.slice(0, 3).forEach(err => {
                        errorMessage += `  • ${err}\n`;
                    });
                    if (otherErrors.length > 3) {
                        errorMessage += `  • ... and ${otherErrors.length - 3} more issues\n`;
                    }
                    errorMessage += '\n💡 Tip: Check console for detailed logs\n';
                }
                
                // Add summary
                const totalErrors = result.data.errors.length;
                const totalWarnings = applicationWarnings.length;
                const actualErrors = totalErrors - totalWarnings;
                
                errorMessage += '\n📊 Summary:\n';
                if (actualErrors > 0) {
                    errorMessage += `• ${actualErrors} records failed to import\n`;
                }
                if (totalWarnings > 0) {
                    errorMessage += `• ${totalWarnings} warnings (records still imported)\n`;
                }
                errorMessage += `• Check console logs for full details\n`;
                
                setTimeout(() => {
                    alert(errorMessage);
                }, 1000);
            }
            
            closeModal('importModal');
            
            // Refresh voucher table and dashboard stats
            renderVoucherTable();
            loadDashboardStats();
        } else {
            // Handle different types of errors
            const errorMessage = result.message || 'Error importing vouchers';
            const errorData = result.data || {};
            
            if (errorData.errorType === 'database') {
                // Database-specific error handling
                let detailedMessage = `❌ Database Error:\n${errorMessage}\n\n`;
                
                if (errorData.errorCode) {
                    detailedMessage += `Error Code: ${errorData.errorCode}\n`;
                }
                
                if (errorData.timestamp) {
                    detailedMessage += `Time: ${errorData.timestamp}\n`;
                }
                
                detailedMessage += '\n💡 Suggestions:\n';
                detailedMessage += '• Check your import data format\n';
                detailedMessage += '• Ensure all employees exist\n';
                detailedMessage += '• Try importing smaller batches\n';
                detailedMessage += '• Contact support if problem persists';
                
                alert(detailedMessage);
                showNotification(errorMessage, 'error');
            } else {
                // Generic error handling
                showNotification(errorMessage, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        
        let errorMessage = 'Import failed';
        let detailedMessage = '';
        
        if (error.message.includes('HTTP error')) {
            errorMessage = 'Server communication error';
            detailedMessage = `❌ Server Error:\nUnable to communicate with server (${error.message})\n\n`;
            detailedMessage += '💡 Suggestions:\n';
            detailedMessage += '• Check your internet connection\n';
            detailedMessage += '• Verify XAMPP server is running\n';
            detailedMessage += '• Try refreshing the page\n';
            detailedMessage += '• Check import file size (may be too large)';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network connection error';
            detailedMessage = `❌ Network Error:\nUnable to reach the server\n\n`;
            detailedMessage += '💡 Suggestions:\n';
            detailedMessage += '• Check your internet connection\n';
            detailedMessage += '• Ensure XAMPP Apache server is running\n';
            detailedMessage += '• Try refreshing the page';
        } else {
            errorMessage = 'Unexpected error occurred during import';
            detailedMessage = `❌ Unexpected Error:\n${error.message}\n\n`;
            detailedMessage += '💡 Suggestion:\n';
            detailedMessage += '• Try refreshing the page and importing again\n';
            detailedMessage += '• Check browser console for more details';
        }
        
        if (detailedMessage) {
            alert(detailedMessage);
        }
        
        showNotification(errorMessage, 'error');
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
                    formData.append('id', currentDeleteId);
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
                        if (data[currentDeleteType + 's']) {
                            if (data[currentDeleteType + 's'][currentDeleteId]) {
                                delete data[currentDeleteType + 's'][currentDeleteId];
                            } else {
                                for (const key in data[currentDeleteType + 's']) {
                                    if (data[currentDeleteType + 's'][key].auto_id == currentDeleteId || data[currentDeleteType + 's'][key].id == currentDeleteId) {
                                        delete data[currentDeleteType + 's'][key];
                                        break;
                                    }
                                }
                            }
                        }
                        showNotification('Record deleted successfully!', 'success');
                        closeModal('deleteModal');
                        
                        // Refresh the appropriate table
                        if (currentDeleteType === 'employee') {
                            renderEmployeeTable();
                        } else if (currentDeleteType === 'borrower') {
                            renderBorrowerTable();
                        } else if (currentDeleteType === 'voucher') {
                            renderVoucherTable();
                            // Reload borrowers data so updated outstanding amounts and statuses are reflected
                            loadDataFromAPI('borrowers').then(() => {
                                renderBorrowerTable();
                                loadDashboardStats();
                            });
                            // If view modal was open for this employee's vouchers, update it or close it
                            if (currentDeleteEmpId) {
                                const remaining = Object.values(data.vouchers || {}).filter(v => v.empId === currentDeleteEmpId);
                                if (remaining.length > 0) {
                                    viewEmployeeVouchers(currentDeleteEmpId);
                                } else {
                                    closeModal('viewModal');
                                }
                            }
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
    
    // Initialize settings
    loadSettings();
    setupAutoSave();
});

/**
 * Setup search functionality for all sections - simplified version
 */
// Change password form handler - moved outside of DOMContentLoaded for proper scoping
document.addEventListener('DOMContentLoaded', function() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
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
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No employees found matching your search.</td></tr>';
        return;
    }
    
    let html = '';
    filteredEmployees.forEach(employee => {
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
                <td class="emp-id-cell">${employee.id}</td>
                <td>${employee.name}</td>
                <td>${entryDate}</td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewRecord('employee', '${employee.id}')" title="View">${ICON_EYE}</button>
                    <button class="edit-btn action-btn-icon" onclick="editRecord('employee', '${employee.id}')" title="Edit">${ICON_EDIT}</button>
                    <button class="delete-btn action-btn-icon" onclick="deleteRecord('employee', '${employee.id}')" title="Delete">${ICON_DELETE}</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Filter borrower table based on search term
 * @param {string} searchTerm - The search term to filter by
 */
function filterBorrowerTable(searchTerm) {
    console.log('filterBorrowerTable called with searchTerm:', searchTerm);
    
    // Check if data exists
    if (!data || !data.borrowers) {
        console.error('Borrowers data not available');
        return;
    }
    
    const borrowers = data.borrowers;
    console.log('Total borrowers:', Object.keys(borrowers).length);
    
    const tbody = document.querySelector('#borrowers-content .requests-table tbody');
    
    if (!tbody) {
        console.log('Borrower table tbody not found');
        return;
    }
    
    // If search term is empty, show all borrowers
    if (!searchTerm || searchTerm.trim() === '') {
        console.log('Empty search term, rendering all borrowers');
        renderBorrowerTable();
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    console.log('Searching for:', searchLower);
    
    const filteredBorrowers = Object.values(borrowers).filter(borrower => {
        const matches = (
            (borrower.applicationNo && borrower.applicationNo.toString().toLowerCase().includes(searchLower)) ||
            (borrower.empId && borrower.empId.toString().toLowerCase().includes(searchLower)) ||
            (borrower.name && borrower.name.toString().toLowerCase().includes(searchLower)) ||
            (borrower.month && borrower.month.toString().toLowerCase().includes(searchLower)) ||
            (borrower.status && borrower.status.toString().toLowerCase().includes(searchLower))
        );
        
        if (matches) {
            console.log('Match found:', borrower.empId, borrower.name);
        }
        
        return matches;
    });
    
    console.log('Filtered borrowers count:', filteredBorrowers.length);
    
    if (filteredBorrowers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No borrowers found matching your search.</td></tr>';
        return;
    }
    
    let html = '';
    filteredBorrowers.forEach(borrower => {
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
        
        // Determine status display and styling
        const isCompleted = borrower.status === 'completed' || (borrower.outstandingAmount && borrower.outstandingAmount <= 0);
        const statusClass = isCompleted ? 'status-completed' : 'status-active';
        const statusText = isCompleted ? 'Completed' : 'Active';
        const rowClass = isCompleted ? 'completed-row' : '';
        
        // Determine if edit/delete should be disabled for completed records
        const editDisabled = isCompleted ? 'disabled' : '';
        const deleteDisabled = isCompleted ? 'disabled' : '';
        
        html += `
            <tr class="${rowClass}">
                <td class="emp-id-cell">${borrower.empId}</td>
                <td>${borrower.name}</td>
                <td>₹${(borrower.amount || 0).toLocaleString()}</td>
                <td>₹${(borrower.outstandingAmount || borrower.amount || 0).toLocaleString()}</td>
                <td>₹${(borrower.emi || 0).toLocaleString()}</td>
                <td>${borrower.month || 'N/A'}</td>
                <td>${convertDateFormat(borrower.disbursedDate)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewRecord('borrower', '${borrower.empId}')" title="View History">${ICON_EYE}</button>
                    <button class="edit-btn action-btn-icon ${editDisabled}" onclick="editRecord('borrower', '${borrower.id}')" ${editDisabled ? 'disabled title="Cannot edit completed records"' : 'title="Edit"'}>${ICON_EDIT}</button>
                    <button class="delete-btn action-btn-icon ${deleteDisabled}" onclick="deleteRecord('borrower', '${borrower.id}')" ${deleteDisabled ? 'disabled title="Cannot delete completed records"' : 'title="Delete"'}>${ICON_DELETE}</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Test function to manually trigger borrower search - for debugging
 */
function testBorrowerSearch(term) {
    console.log('Manual test of borrower search with term:', term);
    filterBorrowerTable(term || 'test');
}

/**
 * Manually initialize borrower search - backup function
 */
function forceInitializeBorrowerSearch() {
    const searchInput = document.querySelector('#borrowers-content .search-input');
    console.log('Force initialize - search input found:', !!searchInput);
    
    if (searchInput) {
        searchInput.removeEventListener('input', filterBorrowerTable);
        searchInput.addEventListener('input', function(e) {
            console.log('Force initialized search triggered:', e.target.value);
            filterBorrowerTable(e.target.value);
        });
        console.log('Force initialization complete');
        return true;
    }
    return false;
}

/**
 * Filter voucher table based on search term
 * @param {string} searchTerm - The search term to filter by
 */
function filterVoucherTable(searchTerm) {
    const vouchers = data.vouchers;
    const tbody = document.querySelector('#vouchers-content .requests-table tbody');
    
    if (!tbody) return;
    
    if (Object.keys(vouchers).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No vouchers found. Click "Create New Voucher" to get started.</td></tr>';
        return;
    }
    
    // Group vouchers by employee and filter
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
    
    // Filter employee groups based on search term
    const filteredEmployeeGroups = Object.values(employeeGroups).filter(employee => 
        (employee.empId && employee.empId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.empName && employee.empName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        employee.vouchers.some(voucher => 
            (voucher.applicationNo && voucher.applicationNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (voucher.month && voucher.month.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (voucher.id && voucher.id.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );
    
    if (filteredEmployeeGroups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No vouchers found matching your search.</td></tr>';
        return;
    }
    
    let html = '';
    filteredEmployeeGroups.forEach(employee => {
        html += `
            <tr>
                <td class="emp-id-cell">${employee.empId}</td>
                <td>${employee.empName}</td>
                <td><span class="voucher-count">${employee.vouchers.length}</span></td>
                <td><span class="amount-total">₹${(employee.totalAmount || 0).toLocaleString()}</span></td>
                <td>
                    <button class="view-btn action-btn-icon" onclick="viewEmployeeVouchers('${employee.empId}')" title="View Vouchers">${ICON_EYE}</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ========================================
// Settings Functions
// ========================================

/**
 * Load settings from localStorage or set defaults
 */
function loadSettings() {
    const defaultSettings = {
        appName: 'Advance Portal',
        recordsPerPage: 25,
        autoSave: true,
        darkMode: false,
        defaultCurrency: 'INR',
        dateFormat: 'DD-MM-YYYY',
        autoCalculateEMI: true,
        userEmail: 'admin@example.com',
        autoBackup: false,
        backupRetention: 30,
        exportFormat: 'xlsx'
    };

    const savedSettings = localStorage.getItem('advancePortalSettings');
    const settings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;

    // Apply settings to form elements
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });

    // Apply dark mode if enabled
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Load system information
    loadSystemInfo();

    return settings;
}

/**
 * Save all settings to localStorage
 */
function saveAllSettings() {
    const settings = {};
    const settingElements = document.querySelectorAll('#settings-content input, #settings-content select');
    
    settingElements.forEach(element => {
        if (element.type === 'checkbox') {
            settings[element.name] = element.checked;
        } else {
            settings[element.name] = element.value;
        }
    });

    // Save to localStorage
    localStorage.setItem('advancePortalSettings', JSON.stringify(settings));

    // Apply dark mode immediately
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Update app name in header
    const logoSection = document.querySelector('.logo-section h2');
    if (logoSection && settings.appName) {
        logoSection.textContent = settings.appName;
    }

    showNotification('Settings saved successfully!', 'success');
}

/**
 * Reset all settings to defaults
 */
function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
        localStorage.removeItem('advancePortalSettings');
        loadSettings();
        showNotification('Settings reset to defaults successfully!', 'info');
    }
}

/**
 * Load system information
 */
function loadSystemInfo() {
    // Update last login
    const lastLoginElement = document.getElementById('lastLogin');
    if (lastLoginElement) {
        const lastLogin = localStorage.getItem('lastLogin') || 'First time login';
        lastLoginElement.textContent = lastLogin;
    }

    // Update current login time
    const now = new Date().toLocaleString();
    localStorage.setItem('lastLogin', now);

    // Calculate total records
    const totalRecordsElement = document.getElementById('totalRecords');
    if (totalRecordsElement) {
        const employeeCount = Object.keys(data.employees).length;
        const borrowerCount = Object.keys(data.borrowers).length;
        const voucherCount = Object.keys(data.vouchers).length;
        const total = employeeCount + borrowerCount + voucherCount;
        totalRecordsElement.textContent = `${total} (${employeeCount} employees, ${borrowerCount} borrowers, ${voucherCount} vouchers)`;
    }

    // Simulate database version and size
    const dbVersionElement = document.getElementById('dbVersion');
    if (dbVersionElement) {
        dbVersionElement.textContent = 'MySQL 8.0.x';
    }

    const dbSizeElement = document.getElementById('dbSize');
    if (dbSizeElement) {
        // Estimate database size based on records
        const estimatedSize = (Object.keys(data.employees).length * 0.1 + 
                              Object.keys(data.borrowers).length * 0.2 + 
                              Object.keys(data.vouchers).length * 0.15).toFixed(1);
        dbSizeElement.textContent = `~${estimatedSize} MB`;
    }
}

/**
 * Open change password modal
 */
function openChangePasswordModal() {
    openModal('changePasswordModal');
    // Clear any previous values
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

/**
 * Change password functionality
 */
async function changePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
        showNotification('All fields are required!', 'error');
        return false;
    }
    
    if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters long!', 'error');
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return false;
    }
    
    try {
        showNotification('Changing password...', 'info');
        
        const response = await fetch('api.php?action=change_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_password: oldPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password changed successfully!', 'success');
            closeModal('changePasswordModal');
            
            // Clear the form
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showNotification(result.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('An error occurred while changing password', 'error');
    }
    
    return true;
}

/**
 * Update user email
 */
async function updateEmail() {
    const emailInput = document.getElementById('userEmail');
    const newEmail = emailInput.value.trim();
    
    if (!newEmail) {
        showNotification('Email is required', 'error');
        return;
    }
    
    if (!isValidEmail(newEmail)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        showNotification('Updating email...', 'info');
        
        const response = await fetch('api.php?action=update_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: newEmail
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Email updated successfully!', 'success');
            // Update the display if needed
            if (result.data && result.data.email) {
                emailInput.value = result.data.email;
            }
        } else {
            showNotification(result.message || 'Failed to update email', 'error');
        }
    } catch (error) {
        console.error('Email update error:', error);
        showNotification('An error occurred while updating email', 'error');
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Initialize email change tracking
 */
function initializeEmailTracking() {
    const emailInput = document.getElementById('userEmail');
    if (emailInput) {
        const originalEmail = emailInput.value;
        
        emailInput.addEventListener('input', function() {
            const saveButton = this.parentElement.querySelector('button');
            if (this.value !== originalEmail && this.value.trim() !== '') {
                saveButton.style.backgroundColor = '#ff6b35';
                saveButton.textContent = '💾 Save Changes';
            } else {
                saveButton.style.backgroundColor = '';
                saveButton.textContent = '💾 Save';
            }
        });
    }
}

// Initialize email tracking when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEmailTracking();
});

/**
 * Create backup functionality
 */
function createBackup() {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {
                employees: data.employees,
                borrowers: data.borrowers,
                vouchers: data.vouchers
            },
            settings: JSON.parse(localStorage.getItem('advancePortalSettings') || '{}')
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `advance_portal_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Backup created and downloaded successfully!', 'success');
    } catch (error) {
        console.error('Backup creation failed:', error);
        showNotification('Failed to create backup. Please try again.', 'error');
    }
}

/**
 * Auto-save settings when changed
 */
function setupAutoSave() {
    const settingElements = document.querySelectorAll('#settings-content input, #settings-content select');
    
    settingElements.forEach(element => {
        element.addEventListener('change', function() {
            const autoSaveEnabled = document.getElementById('autoSave')?.checked;
            if (autoSaveEnabled) {
                saveAllSettings();
            }
        });
    });
}
