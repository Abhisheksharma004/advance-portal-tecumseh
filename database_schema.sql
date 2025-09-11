-- SQL Server Database Schema
-- Converted from MySQL for Advance Portal Tecumseh

-- Create Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'eaccess')
BEGIN
    CREATE DATABASE eaccess;
END
GO

USE eaccess;
GO

-- Drop tables if they exist (in correct order due to foreign keys)
IF OBJECT_ID('advance_vouchers', 'U') IS NOT NULL DROP TABLE advance_vouchers;
IF OBJECT_ID('advance_borrowers', 'U') IS NOT NULL DROP TABLE advance_borrowers;
IF OBJECT_ID('advance_employees', 'U') IS NOT NULL DROP TABLE advance_employees;
IF OBJECT_ID('advance_users', 'U') IS NOT NULL DROP TABLE advance_users;
GO

-- Table: advance_users
CREATE TABLE advance_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(10) NOT NULL DEFAULT 'user',
    status NVARCHAR(10) NOT NULL DEFAULT 'active',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_advance_users_role CHECK (role IN ('admin', 'user')),
    CONSTRAINT CHK_advance_users_status CHECK (status IN ('active', 'inactive'))
);
GO

-- Table: advance_employees
CREATE TABLE advance_employees (
    id NVARCHAR(20) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    status NVARCHAR(10) NOT NULL DEFAULT 'active',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_advance_employees_status CHECK (status IN ('active', 'inactive'))
);
GO

-- Table: advance_borrowers
CREATE TABLE advance_borrowers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    application_no NVARCHAR(50) NOT NULL UNIQUE,
    emp_id NVARCHAR(20) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    outstanding_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    emi DECIMAL(10,2) NOT NULL,
    months INT NOT NULL,
    disbursed_date DATE NOT NULL,
    status NVARCHAR(15) NOT NULL DEFAULT 'active',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_advance_borrowers_status CHECK (status IN ('active', 'cancelled', 'completed')),
    CONSTRAINT FK_advance_borrowers_emp_id FOREIGN KEY (emp_id) REFERENCES advance_employees(id)
);
GO

-- Table: advance_vouchers
CREATE TABLE advance_vouchers (
    auto_id INT IDENTITY(1,1) PRIMARY KEY,
    id NVARCHAR(20) NOT NULL,  -- Removed UNIQUE constraint to allow duplicate voucher IDs
    emp_id NVARCHAR(20) NOT NULL,
    emp_name NVARCHAR(255) NOT NULL,
    voucher_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month NVARCHAR(20) NOT NULL,
    application_no NVARCHAR(50) NULL,
    status NVARCHAR(15) NOT NULL DEFAULT 'pending',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_advance_vouchers_status CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    CONSTRAINT FK_advance_vouchers_emp_id FOREIGN KEY (emp_id) REFERENCES advance_employees(id),
    CONSTRAINT FK_advance_vouchers_application_no FOREIGN KEY (application_no) REFERENCES advance_borrowers(application_no)
);
GO

-- Create triggers for updated_at columns
CREATE TRIGGER trg_advance_users_updated_at
ON advance_users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE advance_users 
    SET updated_at = GETDATE()
    FROM advance_users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

CREATE TRIGGER trg_advance_employees_updated_at
ON advance_employees
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE advance_employees 
    SET updated_at = GETDATE()
    FROM advance_employees e
    INNER JOIN inserted i ON e.id = i.id;
END;
GO

CREATE TRIGGER trg_advance_borrowers_updated_at
ON advance_borrowers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE advance_borrowers 
    SET updated_at = GETDATE()
    FROM advance_borrowers b
    INNER JOIN inserted i ON b.id = i.id;
END;
GO

CREATE TRIGGER trg_advance_vouchers_updated_at
ON advance_vouchers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE advance_vouchers 
    SET updated_at = GETDATE()
    FROM advance_vouchers v
    INNER JOIN inserted i ON v.auto_id = i.auto_id;
END;
GO

-- Insert default admin user
INSERT INTO advance_users (username, email, password, role, status) 
VALUES ('admin', 'admin@tecumseh.com', '$2y$10$DL2gacVha9nQ6T8rqX2MyuEnXY47rGHzVvHpo9JghcVyedttT2iO2', 'admin', 'active');
GO

-- Create indexes for better performance
CREATE INDEX IX_advance_borrowers_emp_id ON advance_borrowers(emp_id);
CREATE INDEX IX_advance_borrowers_status ON advance_borrowers(status);
CREATE INDEX IX_advance_vouchers_emp_id ON advance_vouchers(emp_id);
CREATE INDEX IX_advance_vouchers_status ON advance_vouchers(status);
CREATE INDEX IX_advance_vouchers_application_no ON advance_vouchers(application_no);
GO

PRINT 'SQL Server database schema created successfully!';
