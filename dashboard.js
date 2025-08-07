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

// ========================================
// Data Loading Functions
// ========================================

/**
 * Load data from database via API
 */
async function loadDataFromAPI(type) {
    try {
        const response = await fetch(`api.php?action=get_${type}`, {
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
            return;
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success) {
            const stats = result.data;
            
            // Update stat cards
            const statCards = document.querySelectorAll('#dashboard-content .stat-card .stat-content h3');
            if (statCards.length >= 4) {
                statCards[0].textContent = stats.totalEmployees || '0';
                statCards[1].textContent = stats.activeBorrowers || '0';
                statCards[2].textContent = stats.activeVouchers || '0';
                statCards[3].textContent = `₹${(stats.outstandingAmount || 0).toLocaleString()}`;
            }
        } else {
            console.error('Dashboard stats error:', result.message);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        if (error instanceof SyntaxError) {
            console.error('JSON parsing error for dashboard stats');
        }
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">No borrowers found. Click "Add New Borrower" to get started.</td></tr>';
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
                <td>${borrower.empId}</td>
                <td>${borrower.name}</td>
                <td>₹${borrower.amount}</td>
                <td>₹${borrower.emi}</td>
                <td>${borrower.month}</td>
                <td>${convertDateFormat(borrower.disbursedDate)}</td>
                <td>${entryDate}</td>
                <td>
                    <button class="view-btn" onclick="viewRecord('borrower', '${borrower.empId}')">View</button>
                    <button class="edit-btn" onclick="editRecord('borrower', '${borrower.empId}')">Edit</button>
                    <button class="delete-btn" onclick="deleteRecord('borrower', '${borrower.empId}')">Delete</button>
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No vouchers found. Click "Create New Voucher" to get started.</td></tr>';
        return;
    }
    
    let html = '';
    Object.values(vouchers).forEach(voucher => {
        html += `
            <tr>
                <td>${voucher.id}</td>
                <td>${voucher.empId}</td>
                <td>${voucher.empName}</td>
                <td>${convertDateFormat(voucher.date)}</td>
                <td>₹${voucher.amount}</td>
                <td>${voucher.month}</td>
                <td>
                    <button class="view-btn" onclick="viewRecord('voucher', '${voucher.id}')">View</button>
                    <button class="edit-btn" onclick="editRecord('voucher', '${voucher.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteRecord('voucher', '${voucher.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
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
            employee: borrower.name,
            amount: `₹${borrower.amount}`,
            type: 'Advance',
            status: 'Active'
        });
    });
    
    // Add voucher activities
    Object.values(data.vouchers).forEach(voucher => {
        activities.push({
            date: voucher.date || new Date().toISOString().split('T')[0],
            employee: voucher.empName,
            amount: `₹${voucher.amount}`,
            type: 'Voucher',
            status: 'Processed'
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
        const statusClass = activity.status === 'Active' ? 'status-active' : 'status-processed';
        html += `
            <tr>
                <td>${formatDate(activity.date)}</td>
                <td>${activity.employee}</td>
                <td>${activity.amount}</td>
                <td>${activity.type}</td>
                <td><span class="status ${statusClass}">${activity.status}</span></td>
                <td>
                    <button class="view-btn" onclick="viewActivityDetails('${activity.type}', '${activity.employee}')">View</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Update reports table
 */
function updateReportsTable() {
    const tbody = document.querySelector('#reports-content .requests-table tbody');
    if (!tbody) return;
    
    // This would typically fetch from database, for now we'll show static data
    const reports = [
        {
            name: 'Advance Summary Report',
            description: 'Complete overview of all advance payments and outstanding amounts',
            type: 'Summary',
            lastGenerated: 'Never',
            status: 'Ready',
            action: 0
        },
        {
            name: 'Employee Advance Report',
            description: 'Individual employee advance history and outstanding amounts',
            type: 'Detail',
            lastGenerated: 'Never',
            status: 'Ready',
            action: 1
        },
        {
            name: 'Department Wise Report',
            description: 'Department-wise advance utilization and recovery analysis',
            type: 'Analytics',
            lastGenerated: 'Never',
            status: 'Ready',
            action: 2
        },
        {
            name: 'Outstanding Amount Report',
            description: 'Detailed report of all outstanding advances and recovery timeline',
            type: 'Detail',
            lastGenerated: 'Never',
            status: 'Ready',
            action: 3
        },
        {
            name: 'Voucher Report',
            description: 'Complete voucher transaction history and audit trail',
            type: 'Detail',
            lastGenerated: 'Never',
            status: 'Ready',
            action: 4
        }
    ];
    
    let html = '';
    reports.forEach(report => {
        html += `
            <tr>
                <td>${report.name}</td>
                <td>${report.description}</td>
                <td>${report.type}</td>
                <td>${report.lastGenerated}</td>
                <td><span class="status status-pending">${report.status}</span></td>
                <td>
                    <button class="view-btn" onclick="generateReport(${report.action})">Generate</button>
                    <button class="edit-btn" onclick="previewReport('${report.type.toLowerCase()}')">Preview</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Generate specific report
 * @param {number} reportType - Type of report to generate
 */
function generateReport(reportType) {
    const reportNames = [
        'Advance Summary Report',
        'Employee Advance Report', 
        'Department Wise Report',
        'Outstanding Amount Report',
        'Voucher Report'
    ];
    
    alert(`Generating ${reportNames[reportType]}...`);
    
    // Here you would implement actual report generation
    // For now, we'll just show a success message
    setTimeout(() => {
        alert(`${reportNames[reportType]} generated successfully!`);
        updateReportsTable(); // Refresh the table to show updated "Last Generated" time
    }, 1500);
}

/**
 * Preview report
 * @param {string} reportType - Type of report to preview
 */
function previewReport(reportType) {
    alert(`Previewing ${reportType} report...`);
    // Here you would implement report preview functionality
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
 * @param {string} type - Type of activity
 * @param {string} employee - Employee name
 */
function viewActivityDetails(type, employee) {
    alert(`Viewing ${type} details for ${employee}`);
    // Here you would implement activity detail view
}

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
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
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
        case 'borrower':
            content = `
                <div class="record-details">
                    <div class="detail-row"><strong>Employee ID:</strong> ${record.empId}</div>
                    <div class="detail-row"><strong>Name:</strong> ${record.name}</div>
                    <div class="detail-row"><strong>Advance Amount:</strong> ₹${record.amount}</div>
                    <div class="detail-row"><strong>EMI:</strong> ₹${record.emi}</div>
                    <div class="detail-row"><strong>Month:</strong> ${record.month}</div>
                    <div class="detail-row"><strong>Disbursed Date:</strong> ${convertDateFormat(record.disbursedDate)}</div>
                </div>
            `;
            break;
        case 'voucher':
            content = `
                <div class="record-details">
                    <div class="detail-row"><strong>Voucher No:</strong> ${record.id}</div>
                    <div class="detail-row"><strong>Employee ID:</strong> ${record.empId}</div>
                    <div class="detail-row"><strong>Employee Name:</strong> ${record.empName}</div>
                    <div class="detail-row"><strong>Voucher Date:</strong> ${convertDateFormat(record.date)}</div>
                    <div class="detail-row"><strong>Amount:</strong> ₹${record.amount}</div>
                    <div class="detail-row"><strong>Month:</strong> ${record.month}</div>
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
                    <input type="date" name="disbursedDate" value="${record.disbursedDate}" required>
                </div>
            `;
            break;
        case 'voucher':
            formFields = `
                <div class="form-group">
                    <label>Voucher No:</label>
                    <input type="text" name="id" value="${record.id}" readonly>
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
                    <label>Voucher Date:</label>
                    <input type="date" name="date" value="${record.date}" required>
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
                    <label>Voucher No:</label>
                    <input type="text" name="id" required placeholder="VCH-004">
                </div>
                <div class="form-group">
                    <label>Employee ID:</label>
                    <input type="text" id="voucher-empId" name="empId" required placeholder="EMP001">
                </div>
                <div class="form-group">
                    <label>Employee Name:</label>
                    <input type="text" id="voucher-empName" name="empName" required placeholder="Enter employee name">
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
                
                // Auto-fill employee name when Employee ID is entered
                if (empIdInput && empNameInput) {
                    empIdInput.addEventListener('input', function() {
                        const empId = this.value.trim();
                        if (empId && data.employees && data.employees[empId]) {
                            empNameInput.value = data.employees[empId].name;
                            empNameInput.style.backgroundColor = '#e8f5e8'; // Light green to show auto-filled
                        } else {
                            empNameInput.value = '';
                            empNameInput.style.backgroundColor = '';
                        }
                    });
                    
                    // Also trigger on blur for better UX
                    empIdInput.addEventListener('blur', function() {
                        const empId = this.value.trim();
                        if (empId && data.employees && data.employees[empId]) {
                            empNameInput.value = data.employees[empId].name;
                            empNameInput.style.backgroundColor = '#e8f5e8';
                        } else if (empId && (!data.employees || !data.employees[empId])) {
                            empNameInput.value = '';
                            empNameInput.style.backgroundColor = '#ffe8e8'; // Light red for invalid ID
                            empNameInput.placeholder = 'Employee ID not found';
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
        // Ensure borrower data follows the correct field order
        orderedData = Object.values(records).map(record => ({
            empId: record.empId,
            name: record.name,
            amount: record.amount,
            month: record.month,
            emi: record.emi,
            disbursedDate: record.disbursedDate
        }));
    } else if (type === 'employee') {
        // Ensure employee data follows the correct field order
        orderedData = Object.values(records).map(record => ({
            id: record.id,
            name: record.name
        }));
    } else if (type === 'voucher') {
        // Ensure voucher data follows the correct field order
        orderedData = Object.values(records).map(record => ({
            id: record.id,
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
        const orderedBorrowers = Object.values(allData.borrowers).map(record => ({
            empId: record.empId,
            name: record.name,
            amount: record.amount,
            month: record.month,
            emi: record.emi,
            disbursedDate: record.disbursedDate
        }));
        const borrowersWS = XLSX.utils.json_to_sheet(orderedBorrowers);
        XLSX.utils.book_append_sheet(workbook, borrowersWS, 'Borrowers');
    }
    
    // Add Vouchers sheet
    if (Object.keys(allData.vouchers).length > 0) {
        const orderedVouchers = Object.values(allData.vouchers).map(record => ({
            id: record.id,
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
    
    // Normalize column names to lowercase for consistency
    data.forEach(row => {
        if (row.hasOwnProperty('ID')) row.id = row.ID;
        if (row.hasOwnProperty('Id')) row.id = row.Id;
        if (row.hasOwnProperty('NAME')) row.name = row.NAME;
        if (row.hasOwnProperty('Name')) row.name = row.Name;
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
    const hasAmount = firstRow.hasOwnProperty('amount') || firstRow.hasOwnProperty('Amount') || firstRow.hasOwnProperty('Advance Amount');
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
        throw new Error('Excel file must contain an "amount" or "Advance Amount" column.');
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
        if (row.hasOwnProperty('Month')) row.month = row.Month;
        if (row.hasOwnProperty('MONTH')) row.month = row.MONTH;
        if (row.hasOwnProperty('EMI')) row.emi = row.EMI;
        if (row.hasOwnProperty('Emi')) row.emi = row.Emi;
        if (row.hasOwnProperty('Disbursed Date')) row.disbursedDate = row['Disbursed Date'];
        if (row.hasOwnProperty('disbursed_date')) row.disbursedDate = row.disbursed_date;
        
        // Convert disbursed date format from YYYY-MM-DD to DD-MM-YYYY
        if (row.disbursedDate) {
            row.disbursedDate = convertDateFormat(row.disbursedDate);
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
        empId: borrower.empId,
        name: borrower.name,
        amount: borrower.amount,
        emi: borrower.emi,
        month: borrower.month,
        disbursedDate: borrower.disbursedDate
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
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
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
                    // Update local data
                    const record = {};
                    for (let [key, value] of formData.entries()) {
                        record[key] = isNaN(value) ? value : Number(value);
                    }
                    
                    // For borrowers, use empId as the key
                    let recordKey;
                    if (type === 'borrower') {
                        recordKey = record.empId;
                    } else {
                        recordKey = id;
                    }
                    
                    data[type + 's'][recordKey] = record;
                    
                    // Refresh the table
                    showNotification('Record updated successfully!', 'success');
                    closeModal('editModal');
                    
                    // Refresh the appropriate table
                    if (type === 'employee') {
                        renderEmployeeTable();
                    } else if (type === 'borrower') {
                        renderBorrowerTable();
                    } else if (type === 'voucher') {
                        renderVoucherTable();
                    }
                    
                    // Refresh dashboard stats
                    loadDashboardStats();
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
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const type = this.getAttribute('data-type');
            const formData = new FormData(this);
            
            // Send data to API
            fetch(`api.php?action=add_${type}`, {
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
                    // Update local data
                    const record = result.data;
                    
                    // For borrowers, use empId as the key instead of generating a separate ID
                    let recordKey;
                    if (type === 'borrower') {
                        recordKey = record.empId;
                    } else {
                        recordKey = record.id;
                    }
                    
                    data[type + 's'][recordKey] = record;
                    
                    showNotification('Record created successfully!', 'success');
                    closeModal('addModal');
                    
                    // Refresh the appropriate table
                    if (type === 'employee') {
                        renderEmployeeTable();
                    } else if (type === 'borrower') {
                        renderBorrowerTable();
                    } else if (type === 'voucher') {
                        renderVoucherTable();
                    }
                    
                    // Refresh dashboard stats
                    loadDashboardStats();
                } else {
                    showNotification(result.message || 'Error creating record', 'error');
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

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (currentDeleteType && currentDeleteId) {
                // Create form data for delete request
                const formData = new FormData();
                if (currentDeleteType === 'employee') {
                    formData.append('id', currentDeleteId);
                } else if (currentDeleteType === 'borrower') {
                    formData.append('empId', currentDeleteId);
                } else if (currentDeleteType === 'voucher') {
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
    
    // Initialize dashboard - show dashboard section by default
    showSection('dashboard');
    
    // Initialize data from database
    initializeData();
    
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
