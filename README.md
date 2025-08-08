# Advance Portal - Employee Advance Management System

A comprehensive web application for managing employee advance payments, borrower records, and voucher processing.

## 🚀 Features

- **Employee Management**: Add, edit, view, and delete employee records
- **Advance Payment Tracking**: Manage borrower records with EMI calculations
- **Voucher Processing**: Create and process payment vouchers
- **Dashboard Analytics**: Real-time statistics and recent activity
- **Excel Import/Export**: Bulk data operations with Excel files
- **Responsive Design**: Mobile-friendly interface
- **Secure Authentication**: Login system with session management

## 🛠️ Installation

### Prerequisites
- XAMPP (Apache + MySQL + PHP)
- Web browser (Chrome, Firefox, Safari, etc.)

### Setup Steps

1. **Download and Setup XAMPP**
   - Download XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - Install and start Apache and MySQL services

2. **Place Project Files**
   - Copy the `advance-portal-main` folder to your XAMPP `htdocs` directory
   - Path should be: `C:\xampp\htdocs\advance-portal-main\`

3. **Database Setup**
   - Open your web browser
   - Navigate to: `http://localhost/advance-portal-main/setup_database.php`
   - This will automatically create the database and tables
   - Default database name: `eaccess`

4. **Access the Application**
   - Navigate to: `http://localhost/advance-portal-main/`
   - Login with default credentials:
     - **Username**: admin@tecumseh.com
     - **Password**: admin123

## 📁 Project Structure

```
advance-portal-main/
├── config/
│   └── database.php        # Database configuration
├── api.php                 # REST API endpoints
├── auth.php               # Authentication functions
├── dashboard.php          # Main dashboard page
├── dashboard.js           # Dashboard JavaScript logic
├── dashboard.css          # Dashboard styles
├── login.php              # Login handler
├── login.js               # Login JavaScript
├── logout.php             # Logout handler
├── index.php              # Login page
├── style.css              # Login page styles
├── setup_database.php     # Database setup script
├── tecumseh.png          # Company logo
└── README.md              # This file
```

## 🔧 Configuration

### Database Configuration
Edit `config/database.php` to change database settings:

```php
define('DB_HOST', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'eaccess');
```

### Error Logging
The application logs errors to the PHP error log. Check your XAMPP error logs for troubleshooting.

## 🎯 Usage

### Employee Management
1. Navigate to the **Employees** section
2. Click "Add New Employee" to create records
3. Use Import/Export buttons for bulk operations

### Borrower Management
1. Go to the **Borrowers** section
2. Click "Add New Borrower" to create advance records
3. The system automatically calculates EMI based on amount and duration

### Voucher Processing
1. Access the **Vouchers** section
2. Click "Create New Voucher" for payment processing
3. Track voucher status and history

### Dashboard Analytics
- View real-time statistics on the main dashboard
- Monitor recent activity and outstanding amounts
- Access quick summaries of all data

## 📊 Excel Import/Export

### Import Features
- Bulk import employees, borrowers, and vouchers
- Download templates for proper format
- Data validation and error reporting

### Export Features
- Export individual data types
- Export all data to multi-sheet Excel file
- Formatted reports ready for analysis

## 🔒 Security Features

- Session-based authentication
- Password hashing using PHP's password_hash()
- SQL injection protection with prepared statements
- CSRF protection through proper session management
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **"Unexpected token '<', '<br />' is not valid JSON" Error**
   - This has been fixed with improved error handling
   - Ensure Apache and MySQL are running
   - Run the database setup script if needed

2. **Database Connection Errors**
   - Check if MySQL service is running in XAMPP
   - Verify database configuration in `config/database.php`
   - Run `setup_database.php` to create the database

3. **Login Issues**
   - Use default credentials: admin@tecumseh.com / admin123
   - Clear browser cache and cookies
   - Check if sessions are working properly

4. **Excel Import/Export Not Working**
   - Ensure SheetJS library is loaded (check browser console)
   - Refresh the page if Excel functions are not available
   - Check file permissions for upload directory

## 🔄 Recent Fixes

- ✅ Fixed JSON parsing errors in API responses
- ✅ Improved error handling for all AJAX requests
- ✅ Added comprehensive input validation
- ✅ Enhanced database connection security
- ✅ Added proper output buffering to prevent HTML in JSON
- ✅ Improved mobile responsiveness
- ✅ Added better logging for debugging
- ✅ Cleaned up project structure and removed unused files

## 🤝 Support

For technical support or questions:
1. Check the browser console for JavaScript errors
2. Review PHP error logs in XAMPP
3. Ensure all services are running properly
4. Verify database setup is complete

## 📝 License

This project is for internal use at Tecumseh. All rights reserved.

---

**Note**: This application is designed for local development and testing. For production deployment, additional security measures and server configuration would be required.
