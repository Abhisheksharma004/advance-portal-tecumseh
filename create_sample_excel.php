<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Sample Excel for Voucher Import</title>
    <link rel="stylesheet" href="dashboard.css">
    <style>
        body { padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; }
        .instruction-box { 
            background: #e3f2fd; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #2196f3;
        }
        .download-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .format-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }
        .format-table th, .format-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .format-table th {
            background: #007bff;
            color: white;
            font-weight: bold;
        }
        .format-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px;
        }
        .btn:hover {
            background: #218838;
        }
        .error-fix {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>📊 Create Sample Excel File for Voucher Import</h1>
    
    <div class="error-fix">
        <h3>✅ Fixed Error: "Excel file must contain a Voucher Id column"</h3>
        <p><strong>Solution:</strong> The system now accepts both "Voucher Id" and "Voucher ID" column headers.</p>
        <p><strong>Flexible columns supported:</strong> Voucher Id, Voucher ID, ID, id, voucherId</p>
    </div>
    
    <div class="instruction-box">
        <h3>📋 Required Excel Format</h3>
        <p>Your Excel file must contain exactly these columns (in any order):</p>
        <ul>
            <li><strong>Employee ID</strong> - Employee identifier (e.g., EMP001)</li>
            <li><strong>Employee Name</strong> - Full employee name</li>
            <li><strong>Application Number</strong> - Application reference (e.g., APP000001)</li>
            <li><strong>Voucher Date</strong> - Date in DD/MM/YYYY or DD-MM-YYYY format</li>
            <li><strong>Amount</strong> - Numeric amount</li>
            <li><strong>Month</strong> - Month name (e.g., October)</li>
            <li><strong>Voucher Id</strong> or <strong>Voucher ID</strong> - Voucher identifier (e.g., VCH-002)</li>
        </ul>
    </div>
    
    <div class="download-section">
        <h3>📥 Sample Data Template</h3>
        <p>Copy this data into Excel with exact column headers:</p>
        
        <table class="format-table">
            <thead>
                <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Application Number</th>
                    <th>Voucher Date</th>
                    <th>Amount</th>
                    <th>Month</th>
                    <th>Voucher Id</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>EMP001</td>
                    <td>John Doe</td>
                    <td>APP000001</td>
                    <td>14/10/2025</td>
                    <td>200</td>
                    <td>October</td>
                    <td>VCH-002</td>
                </tr>
                <tr>
                    <td>EMP002</td>
                    <td>Alice Smith</td>
                    <td>APP000002</td>
                    <td>15/10/2025</td>
                    <td>250</td>
                    <td>October</td>
                    <td>VCH-003</td>
                </tr>
                <tr>
                    <td>EMP003</td>
                    <td>Michael Johnson</td>
                    <td>APP000003</td>
                    <td>16/10/2025</td>
                    <td>500</td>
                    <td>October</td>
                    <td>VCH-004</td>
                </tr>
                <tr>
                    <td>EMP004</td>
                    <td>Sophia Williams</td>
                    <td>APP000004</td>
                    <td>17/10/2025</td>
                    <td>400</td>
                    <td>October</td>
                    <td>VCH-005</td>
                </tr>
            </tbody>
        </table>
        
        <button class="btn" onclick="downloadCSV()">📊 Download as CSV Template</button>
        <button class="btn" onclick="copyToClipboard()">📋 Copy Table Data</button>
    </div>
    
    <div class="instruction-box">
        <h3>🔧 Column Name Variations Supported</h3>
        <p>The system is now flexible and accepts these column name variations:</p>
        <ul>
            <li><strong>Voucher ID:</strong> "Voucher Id", "Voucher ID", "ID", "id", "voucherId"</li>
            <li><strong>Employee ID:</strong> "Employee ID", "empId", "employeeId"</li>
            <li><strong>Employee Name:</strong> "Employee Name", "empName", "employeeName"</li>
            <li><strong>Application Number:</strong> "Application Number", "applicationNo", "applicationNumber"</li>
            <li><strong>Voucher Date:</strong> "Voucher Date", "date", "Date"</li>
            <li><strong>Amount:</strong> "Amount", "amount"</li>
            <li><strong>Month:</strong> "Month", "month", "MONTH"</li>
        </ul>
    </div>

    <script>
        function downloadCSV() {
            const csvContent = `Employee ID,Employee Name,Application Number,Voucher Date,Amount,Month,Voucher Id
EMP001,John Doe,APP000001,14/10/2025,200,October,VCH-002
EMP002,Alice Smith,APP000002,15/10/2025,250,October,VCH-003
EMP003,Michael Johnson,APP000003,16/10/2025,500,October,VCH-004
EMP004,Sophia Williams,APP000004,17/10/2025,400,October,VCH-005`;
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'voucher_import_template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        function copyToClipboard() {
            const tableData = `Employee ID	Employee Name	Application Number	Voucher Date	Amount	Month	Voucher Id
EMP001	John Doe	APP000001	14/10/2025	200	October	VCH-002
EMP002	Alice Smith	APP000002	15/10/2025	250	October	VCH-003
EMP003	Michael Johnson	APP000003	16/10/2025	500	October	VCH-004
EMP004	Sophia Williams	APP000004	17/10/2025	400	October	VCH-005`;
            
            navigator.clipboard.writeText(tableData).then(function() {
                alert('✅ Table data copied to clipboard!\n\nYou can now paste this directly into Excel.');
            }, function(err) {
                console.error('Could not copy text: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = tableData;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('✅ Table data copied to clipboard!\n\nYou can now paste this directly into Excel.');
            });
        }
    </script>
    
    <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px;">
        <h3>💡 Import Instructions</h3>
        <ol>
            <li><strong>Create Excel file:</strong> Copy the table data above into Excel</li>
            <li><strong>Save as:</strong> .xlsx or .xls format</li>
            <li><strong>Import:</strong> Go to Dashboard → Import → Voucher → Choose your file</li>
            <li><strong>Preview:</strong> Check the preview shows data correctly</li>
            <li><strong>Confirm:</strong> Click "Confirm Import" to import to database</li>
        </ol>
        <p><strong>Note:</strong> Dates will be automatically converted and stored correctly (no +1 day issue)!</p>
    </div>
    
    <p><a href="dashboard.php" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">🏠 Back to Dashboard</a></p>
</body>
</html>
